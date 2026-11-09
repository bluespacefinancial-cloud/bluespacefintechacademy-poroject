<?php

namespace App\Http\Controllers;

use App\Models\Placement;
use App\Models\Certification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class PlacementsController extends Controller
{
    public function index(Request $request)
    {
        $query = Placement::with(['user', 'certification']);

        // Filter by user if not staff
        if ($request->user()->type !== 'Administrator') {
            $query->where('user_id', $request->user()->id);
        }

        $placements = $query->orderBy('created_at', 'desc')->get();

        return response()->json($placements);
    }

    public function show(Request $request, $id)
    {
        $placement = Placement::with(['user', 'certification'])->findOrFail($id);

        // Check authorization
        if ($request->user()->type !== 'Administrator' && $request->user()->type !== 'Instructor') {
            if ($placement->user_id !== $request->user()->id) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }
        }

        return response()->json($placement);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'certification_id' => 'required|exists:certifications,id',
            'company' => 'required|string|max:200',
            'role' => 'required|string|max:200',
            'location' => 'nullable|string|max:200',
            'starts_at' => 'required|date',
            'ends_at' => 'nullable|date',
            'status' => 'sometimes|string|in:offered,accepted,active,completed,cancelled',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $placement = Placement::create([
            'user_id' => $request->user()->id,
            ...$request->all(),
        ]);

        return response()->json(['message' => 'Placement created', 'placement' => $placement], 201);
    }

    public function update(Request $request, $id)
    {
        $placement = Placement::findOrFail($id);

        // Check authorization
        if ($request->user()->type !== 'Administrator' && $request->user()->type !== 'Instructor') {
            if ($placement->user_id !== $request->user()->id) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }
        }

        $validator = Validator::make($request->all(), [
            'company' => 'sometimes|string|max:200',
            'role' => 'sometimes|string|max:200',
            'location' => 'nullable|string|max:200',
            'starts_at' => 'sometimes|date',
            'ends_at' => 'nullable|date',
            'status' => 'sometimes|string|in:offered,accepted,active,completed,cancelled',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $placement->update($request->all());

        return response()->json(['message' => 'Placement updated', 'placement' => $placement]);
    }

    public function destroy(Request $request, $id)
    {
        $placement = Placement::findOrFail($id);

        // Check authorization
        if ($request->user()->type !== 'Administrator') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $placement->delete();

        return response()->json(['message' => 'Placement deleted']);
    }
}
