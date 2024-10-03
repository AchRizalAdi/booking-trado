<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Booking extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'bookings';

    protected $fillable = [
        'code',
        'trado_id',
        'check_in',
        'check_out',
        'qty',
        'status',
        'create_by',
    ];

    public function trado()
    {
        return $this->belongsTo('App\Models\Trado', 'trado_id', 'id');
    }

    public function user()
    {
        return $this->belongsTo('App\Models\User', 'create_by', 'id');
    }
}
