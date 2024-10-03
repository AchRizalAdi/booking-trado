<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Trado extends Model
{
    use HasFactory;

    protected $table = 'trados';

    protected $fillable = [
        'name',
        'description',
        'qty',
        'qty_on_booking',
        'qty_available',
    ];
}
