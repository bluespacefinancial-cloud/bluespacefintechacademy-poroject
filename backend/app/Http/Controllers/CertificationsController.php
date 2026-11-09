<?php

namespace App\Http\Controllers;

use App\Models\Certification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class CertificationsController extends Controller
{
    public function index(Request $request)
    {
        $query = Certification::with('user');

        // Filter by user if not staff
        if ($request->user()->type !== 'Administrator') {
            $query->where('user_id', $request->user()->id);
        }

        $certifications = $query->orderBy('created_at', 'desc')->get();

        return response()->json($certifications);
    }

    public function show(Request $request, $id)
    {
        $certification = Certification::with('user')->findOrFail($id);

        // Check authorization
        if ($request->user()->type !== 'Administrator') {
            if ($certification->user_id !== $request->user()->id) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }
        }

        return response()->json($certification);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:200',
            'type' => 'required|string|max:50',
            'issued_at' => 'required|date',
            'certificate_url' => 'nullable|url',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $certification = Certification::create([
            'user_id' => $request->user()->id,
            ...$request->all(),
        ]);

        return response()->json(['message' => 'Certification created', 'certification' => $certification], 201);
    }

    public function update(Request $request, $id)
    {
        $certification = Certification::findOrFail($id);

        // Check authorization
        if ($request->user()->type !== 'Administrator') {
            if ($certification->user_id !== $request->user()->id) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }
        }

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|string|max:200',
            'type' => 'sometimes|string|max:50',
            'issued_at' => 'sometimes|date',
            'certificate_url' => 'nullable|url',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $certification->update($request->all());

        return response()->json(['message' => 'Certification updated', 'certification' => $certification]);
    }

    public function destroy(Request $request, $id)
    {
        $certification = Certification::findOrFail($id);

        // Check authorization
        if ($request->user()->type !== 'Administrator') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $certification->delete();

        return response()->json(['message' => 'Certification deleted']);
    }
}
