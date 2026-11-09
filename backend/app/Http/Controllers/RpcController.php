<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class RpcController extends DataProxyController
{
    public function __invoke(Request $request, ?string $function = null)
    {
        if (! is_string($function) || ! preg_match('/^[A-Za-z0-9_]+$/', $function)) {
            return response()->json(['message' => 'Invalid function name.'], 400);
        }

        return $this->forward($request, 'rpc/'.$function);
    }
}
