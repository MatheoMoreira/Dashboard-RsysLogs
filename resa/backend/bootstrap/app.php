<?php

use App\Http\Middleware\EnsureUserIsAdmin;
use App\Http\Middleware\LogHttpRequests;
use App\Services\EventLogger;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Derrière Caddy -> nginx : faire confiance aux proxys du réseau Docker
        // interne pour lire X-Forwarded-For/Proto. Sans ça, $request->ip()
        // renverrait l'IP du conteneur nginx au lieu de l'IP cliente d'origine
        // (qui alimente les journaux de sécurité). On restreint aux plages
        // privées plutôt que '*' pour ne pas accepter un XFF arbitraire.
        $middleware->trustProxies(at: [
            '10.0.0.0/8',
            '172.16.0.0/12',
            '192.168.0.0/16',
        ]);

        // Every API request produces a structured http_request log line.
        $middleware->api(append: [
            LogHttpRequests::class,
        ]);

        $middleware->alias([
            'admin' => EnsureUserIsAdmin::class,
        ]);

        // API is stateless JSON: never redirect guests to a (non-existent) login
        // page. Returning null lets AuthenticationException surface and be rendered
        // as a clean JSON 401 by the handler below.
        $middleware->redirectGuestsTo(fn (Request $request) => $request->is('api/*') ? null : '/login');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $logger = fn (): EventLogger => app(EventLogger::class);

        // The whole API is JSON: never attempt the (non-existent) "login" redirect
        // for unauthenticated requests — always render a JSON 401 instead.
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson()
        );

        // Unauthenticated / missing or invalid token -> security event.
        $exceptions->render(function (AuthenticationException $e, Request $request) use ($logger) {
            $logger()->warning(EventLogger::INVALID_TOKEN, [
                'reason' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Non authentifié.',
                'error' => EventLogger::UNAUTHORIZED_ACCESS,
            ], 401);
        });

        // Authorization (policy) failure -> forbidden_action security event.
        $exceptions->render(function (AuthorizationException $e, Request $request) use ($logger) {
            $logger()->warning(EventLogger::FORBIDDEN_ACTION, [
                'reason' => $e->getMessage(),
                'url' => '/'.ltrim($request->path(), '/'),
            ]);

            return response()->json([
                'message' => 'Action non autorisée.',
                'error' => EventLogger::FORBIDDEN_ACTION,
            ], 403);
        });

        $exceptions->render(function (AccessDeniedHttpException $e, Request $request) use ($logger) {
            $logger()->warning(EventLogger::FORBIDDEN_ACTION, [
                'reason' => $e->getMessage(),
                'url' => '/'.ltrim($request->path(), '/'),
            ]);

            return response()->json([
                'message' => 'Action non autorisée.',
                'error' => EventLogger::FORBIDDEN_ACTION,
            ], 403);
        });

        // Database failures -> system event.
        $exceptions->render(function (QueryException $e, Request $request) use ($logger) {
            $logger()->error(EventLogger::DATABASE_ERROR, [
                'sql_state' => $e->getCode(),
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Erreur interne de base de données.',
                'error' => EventLogger::DATABASE_ERROR,
            ], 500);
        });

        // Anything genuinely unexpected -> unhandled_exception system event.
        $exceptions->report(function (Throwable $e) use ($logger) {
            if (
                $e instanceof ValidationException
                || $e instanceof AuthenticationException
                || $e instanceof AuthorizationException
                || $e instanceof QueryException
                || $e instanceof HttpExceptionInterface
                || $e instanceof \App\Exceptions\BusinessRuleException
            ) {
                return;
            }

            $logger()->error(EventLogger::UNHANDLED_EXCEPTION, [
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
        });
    })->create();
