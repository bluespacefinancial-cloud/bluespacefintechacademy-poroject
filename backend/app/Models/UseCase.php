<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

#[Fillable([
    'title',
    'domain',
    'status',
    'is_published',
])]

class UseCase extends Model
{
    use HasFactory;
}
