<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        try {
            $credentials = $request->only('email', 'password');

            if (auth()->attempt($credentials)) {
                $request->session()->regenerate();
                return response()->json([
                    'message' => 'Login successful',
                    'user' => auth()->user()
                ]);
            } else {
                return response()->json([
                    'message' => 'Invalid credentials',
                ], 401);
            }
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e,
            ], 401);
        }
    }

    public function logout(Request $request)
    {
        try {
            auth()->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return response()->json([
                'message' => 'Logout successful',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e,
            ], 401);
        }
    }

    public function getMe()
    {
        try {
            return response()->json([
                'user' => auth()->user(),
                'csrf_token' => csrf_token(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e,
            ], 401);
        }
    }
}
