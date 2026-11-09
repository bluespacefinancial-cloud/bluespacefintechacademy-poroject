<?php

namespace App\Http\Controllers;

use App\Models\Submission;
use App\Models\Lab;
use App\Models\Assessment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class SubmissionsController extends Controller
{
    public function index(Request $request)
    {
        $query = Submission::with(['user', 'lab', 'assessment']);

        // Filter by user if not staff
        if ($request->user()->type !== 'Administrator' && $request->user()->type !== 'Instructor') {
            $query->where('user_id', $request->user()->id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('lab_id')) {
            $query->where('lab_id', $request->lab_id);
        }

        $submissions = $query->orderBy('created_at', 'desc')->get();

        return response()->json($submissions);
    }

    public function show(Request $request, $id)
    {
        $submission = Submission::with(['user', 'lab', 'assessment'])->findOrFail($id);

        // Check authorization
        if ($request->user()->type === 'Student' && $submission->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        return response()->json($submission);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'lab_id' => 'required|exists:labs,id',
            'assessment_id' => 'nullable|exists:assessments,id',
            'content_url' => 'required|url',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $submission = Submission::create([
            'user_id' => $request->user()->id,
            'lab_id' => $request->lab_id,
            'assessment_id' => $request->assessment_id,
            'content_url' => $request->content_url,
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        return response()->json(['message' => 'Submission created', 'submission' => $submission], 201);
    }

    public function update(Request $request, $id)
    {
        $submission = Submission::findOrFail($id);

        // Check authorization - only owner or staff can update
        if ($request->user()->type !== 'Administrator' && $request->user()->type !== 'Instructor') {
            if ($submission->user_id !== $request->user()->id) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }
        }

        $validator = Validator::make($request->all(), [
            'content_url' => 'sometimes|url',
            'status' => 'sometimes|string|in:submitted,graded,remediation,failed',
            'feedback' => 'nullable|string',
            'score' => 'nullable|numeric|min:0|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $submission->update($request->all());

        return response()->json(['message' => 'Submission updated', 'submission' => $submission]);
    }

    public function destroy(Request $request, $id)
    {
        $submission = Submission::findOrFail($id);

        // Check authorization
        if ($request->user()->type !== 'Administrator') {
            if ($submission->user_id !== $request->user()->id) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }
        }

        $submission->delete();

        return response()->json(['message' => 'Submission deleted']);
    }
}
