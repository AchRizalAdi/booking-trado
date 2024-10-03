<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * @return void
     */
    public function run()
    {
        DB::table('users')->insert([
            'name' => 'Super Admin',
            'email' => 'admin@gmail.com',
            'password' => Hash::make('password'),
        ]);

        $data = [
            [
                'name' => 'Trado 1',
                'description' => 'Trado 1 Description',
                'qty' => 10,
                'qty_on_booking' => 0,
                'qty_available' => 10,
            ],
            [
                'name' => 'Trado 2',
                'description' => 'Trado 2 Description',
                'qty' => 3,
                'qty_on_booking' => 0,
                'qty_available' => 3,
            ],
            [
                'name' => 'Trado 3',
                'description' => 'Trado 3 Description',
                'qty' => 5,
                'qty_on_booking' => 0,
                'qty_available' => 5,
            ]
        ];

        foreach ($data as $key => $value) {
            DB::table('trados')->insert($value);
        }
    }
}
