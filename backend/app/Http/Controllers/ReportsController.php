<?php

namespace App\Http\Controllers;

use App\Models\Cohort;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Http\Request;

class ReportsController extends Controller
{
    public function index(Request $request)
    {
        $reportType = $request->query('type', 'summary');

        switch ($reportType) {
            case 'cohorts':
                return $this->cohortReport();
            case 'submissions':
                return $this->submissionsReport();
            case 'placements':
                return $this->placementsReport();
            case 'certifications':
                return $this->certificationsReport();
            case 'users':
                return $this->usersReport();
            default:
                return response()->json(['error' => 'Invalid report type'], 400);
        }
    }

    protected function cohortReport(Request $request)
    {
        $cohorts = Cohort::with(['enrolments' => function ($q) {
            $q->select('cohort_id', 'user_id', 'status');
        }])->get();

        $data = $cohorts->map(function ($cohort) {
            $enrolments = $cohort->enrolments;

            return [
                'id' => $cohort->id,
                'name' => $cohort->name,
                'total_enrolments' => $cohort->enrolments->count(),
                'active_enrolments' => $cohort->enrolments->where('status', 'active')->count(),
                'completed_enrolments' => $cohort->enrolments->where('status', 'completed')->count(),
                'completion_rate' => $cohort->enrolments->count() > 0
                    ? round(($cohort->enrolments->where('status', 'completed')->count() / $cohort->enrolments->count()) * 100, 2)
                    : 0,
            ];
        });

        return response()->json($data);
    }

    protected function submissionsReport(Request $request)
    {
        $query = Submission::with(['user', 'lab']);

        if ($request->user()->type !== 'Administrator') {
            $query->where('user_id', $request->user()->id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $submissions = $query->get();

        $data = $submissions->map(function ($submission) {
            return [
                'id' => $submission->id,
                'title' => $submission->labs?->title ?? 'Unknown',
                'student' => $submission->user->name,
                'status' => $submission->status,
                'score' => $submission->score,
                'submitted_at' => $submission->submitted_at,
            ];
        });

        return response()->json($data);
    }

    protected function placementsReport(Request $request)
    {
        $query = Placement::with('user');

        if ($request->user()->type !== 'Administrator') {
            $query->where('user_id', $request->user()->id);
        }

        $placements = $query->get();

        return response()->json($placements);
    }

    protected function certificationsReport(Request $request)
    {
        $query = Certification::with('user');

        if ($request->user()->type !== 'Administrator') {
            $query->where('user_id', $request->user()->id);
        }

        $certifications = $query->get();

        return response()->json($certifications);
    }

    protected function usersReport(Request $request)
    {
        if ($request->user()->type !== 'Administrator') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $users = User::select('id', 'name', 'email', 'type', 'is_active', 'created_at')->get();

        return response()->json($users);
    }
}
