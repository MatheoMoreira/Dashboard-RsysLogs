<?php

namespace App\Http\Controllers;

use App\Enums\Role;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\EventLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(private readonly EventLogger $logger)
    {
    }

    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([
            'firstname' => $request->string('firstname'),
            'lastname' => $request->string('lastname'),
            'email' => $request->string('email'),
            'password' => $request->string('password'),
            'role' => Role::USER,
        ]);

        $token = $user->createToken('api')->plainTextToken;

        $this->logger->info(EventLogger::USER_REGISTERED, ['user_id' => $user->id]);

        return response()->json([
            'user' => new UserResource($user),
            'token' => $token,
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->string('email'))->first();

        if (! $user || ! Hash::check((string) $request->string('password'), $user->password)) {
            $this->logger->warning(EventLogger::FAILED_LOGIN, [
                'email' => (string) $request->string('email'),
            ]);

            throw ValidationException::withMessages([
                'email' => ['Les identifiants fournis sont incorrects.'],
            ]);
        }

        $token = $user->createToken('api')->plainTextToken;

        $this->logger->info(EventLogger::USER_LOGIN, ['user_id' => $user->id]);

        return response()->json([
            'user' => new UserResource($user),
            'token' => $token,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        $request->user()->currentAccessToken()->delete();

        $this->logger->info(EventLogger::USER_LOGOUT, ['user_id' => $user->id]);

        return response()->json(['message' => 'Déconnexion réussie.']);
    }

    public function me(Request $request): UserResource
    {
        return new UserResource($request->user());
    }
}
