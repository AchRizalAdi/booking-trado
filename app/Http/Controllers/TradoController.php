<?php

namespace App\Http\Controllers;

use App\Models\Trado;
use Illuminate\Http\Request;

class TradoController extends Controller
{
    public function index()
    {
        try {
            $trados = Trado::all();

            return response()->json([
                'data' => $trados,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e,
            ], 401);
        }
    }
}
