<?php

namespace App\Http\Controllers;

use App\Models\Lab;
use App\Models\Submission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class LabsController extends Controller
{
    public function index(Request $request)
    {
        $labs = Lab::with(['module', 'submissions' => function ($q) {
            $q->where('user_id', auth()->id());
        }])->get();

        return response()->json($labs);
    }

    public function show(Request $request, $id)
    {
        $lab = Lab::findOrFail($id);
        $lab->load(['module', 'submissions' => function ($q) {
            $q->where('user_id', auth()->id());
        }]);

        return response()->json($lab);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:200',
            'instructions' => 'required|string',
            'starter_code' => 'nullable|string',
            'content_url' => 'nullable|url',
            'max_score' => 'nullable|integer|min:0',
            'due_date' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $lab = Lab::create($request->all());

        return response()->json(['message' => 'Lab created', 'lab' => $lab], 201);
    }

    public function update(Request $request, $id)
    {
        $lab = Lab::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|string|max:200',
            'instructions' => 'sometimes|string',
            'starter_code' => 'nullable|string',
            'content_url' => 'nullable|url',
            'max_score' => 'sometimes|integer|min:0',
            'due_date' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $lab->update($request->all());

        return response()->json(['message' => 'Lab updated', 'lab' => $lab]);
    }

    public function destroy($id)
    {
        $lab = Lab::findOrFail($id);
        $lab->delete();

        return response()->json(['message' => 'Lab deleted']);
    }
}
