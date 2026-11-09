<?php

namespace App\Http\Controllers;

use App\Models\Certification;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\Process\Process;

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

    public function generate(Request $request, $id)
    {
        if ($request->user()->type !== 'Administrator') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $certification = Certification::with('user')->findOrFail($id);
        $user = $certification->user;

        $instructor = User::where('type', 'Administrator')->first()?->name
            ?? 'Academic Registrar, BlueSPACE Fintech Academy';

        $outputPath = storage_path("app/public/certificates/{$certification->id}.pdf");
        @mkdir(dirname($outputPath), 0775, true);

        $script = base_path('scripts/certificate_generator.py');
        $logo = public_path('images/certificate-logo.png');

        $process = new Process([
            'python3', $script,
            '--name', $user->name ?? 'Student',
            '--course', $certification->title,
            '--date', $certification->issued_at ? Carbon::parse($certification->issued_at)->format('F d, Y') : now()->format('F d, Y'),
            '--instructor', $instructor,
            '--output', $outputPath,
            '--logo', $logo,
        ]);
        $process->mustRun();

        $relative = "certificates/{$certification->id}.pdf";

        $certification->update(['certificate_url' => Storage::disk('public')->url($relative)]);

        return response()->json([
            'message' => 'Certificate generated',
            'certificate_url' => $certification->certificate_url,
            'certification' => $certification,
        ]);
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
