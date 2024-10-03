<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', function () {
    return view('welcome');
});

Route::post('/login', 'App\Http\Controllers\AuthController@login');
Route::post('/logout', 'App\Http\Controllers\AuthController@logout');
Route::get('/me', 'App\Http\Controllers\AuthController@getMe');

Route::post('/bookings/datatable', 'App\Http\Controllers\BookingController@datatable');
Route::post('/bookings/posting/{id}', 'App\Http\Controllers\BookingController@posting');
Route::post('/bookings/rejected/{id}', 'App\Http\Controllers\BookingController@rejected');
Route::post('/bookings/finished/{id}', 'App\Http\Controllers\BookingController@finished');
Route::resource('bookings', 'App\Http\Controllers\BookingController');

Route::get('/trados', 'App\Http\Controllers\TradoController@index');
