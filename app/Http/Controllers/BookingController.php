<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Trado;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Yajra\DataTables\DataTables;

class BookingController extends Controller
{
    public function datatable(Request $request)
    {
        try {
            $bookings = Booking::with('trado', 'user')->where('create_by', auth()->user()->id);
            return DataTables::of($bookings)
                ->editColumn('check_in', function ($booking) {
                    return date('d F Y', strtotime($booking->check_in));
                })
                ->editColumn('check_out', function ($booking) {
                    return date('d F Y', strtotime($booking->check_out));
                })
                ->editColumn('status', function ($booking) {
                    if ($booking->status == 'draft') {
                        return '<span class="badge badge-secondary">Draft</span>';
                    } elseif ($booking->status == 'posting') {
                        return '<span class="badge badge-primary">Posted</span>';
                    } elseif ($booking->status == 'rejected') {
                        return '<span class="badge badge-danger">Rejected</span>';
                    } elseif ($booking->status == 'finished') {
                        return '<span class="badge badge-success">Finished</span>';
                    }
                })
                ->addColumn('action', function ($booking) {
                    // return '<button class="btn btn-primary" ng-click="detailBooking(' . $booking->id . ')">
                    //             <i class="fas fa-eye"></i>
                    //         </button>
                    //         <button class="btn btn-warning" ng-click="editBooking(' . $booking->id . ')">
                    //             <i class="fas fa-edit"></i>
                    //         </button>
                    //         <button class="btn btn-danger" ng-click="deleteBooking(' . $booking->id . ')">
                    //             <i class="fas fa-trash-alt"></i>
                    //         </button>';
                    $html = '';
                    if ($booking->status == 'draft') {
                        $html .= '
                                <button class="btn btn-primary" ng-click="detailBooking(' . $booking->id . ')">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn btn-warning" ng-click="editBooking(' . $booking->id . ')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-danger" ng-click="deleteBooking(' . $booking->id . ')">
                                    <i class="fas fa-trash-alt"></i>
                                </button>';
                    } else if ($booking->status == 'posting') {
                        $html .= '<button class="btn btn-primary" ng-click="detailBooking(' . $booking->id . ')">
                                    <i class="fas fa-eye"></i>
                                  </button>
                                    <button class="btn btn-success" ng-click="finishBooking(' . $booking->id . ')">
                                        <i class="fas fa-check"></i>
                                    </button>

                                  ';
                    } else {
                        $html .= '<button class="btn btn-primary" ng-click="detailBooking(' . $booking->id . ')">
                                    <i class="fas fa-eye
                                    "></i>';
                    }
                    return $html;
                })
                ->rawColumns(['action', 'status'])
                ->make(true);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e,
            ], 500);
        }
    }

    public function index()
    {
        try {
            $bookings = Booking::with('trado', 'user')->where('create_by', auth()->user()->id)->get();

            return response()->json([
                'bookings' => $bookings,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e,
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $request->validate([
                'trado_id' => 'required',
                'check_in' => 'required',
                'check_out' => 'required',
            ]);

            $booking = Booking::create([
                'code' => 'BK - ' . time() . ' - ' . rand(10, 99),
                'create_by' => auth()->user()->id,
                'trado_id' => (int)$request->trado_id,
                'check_in' => $request->check_in,
                'check_out' => $request->check_out,
                'status' => 'draft',
                'qty' => $request->qty,
            ]);

            return response()->json([
                'message' => 'Booking successful',
                'booking' => $booking,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e,
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $booking = Booking::with('trado', 'user')->where('create_by', auth()->user()->id)->find($id);

            return response()->json([
                'booking' => $booking,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e,
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $booking = Booking::where('create_by', auth()->user()->id)->find($id);

            $booking->update([
                'trado_id' => $request->trado_id,
                'check_in' => $request->check_in,
                'check_out' => $request->check_out,
                'qty' => $request->qty,
            ]);

            return response()->json([
                'message' => 'Booking updated',
                'booking' => $booking,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e,
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $booking = Booking::where('create_by', auth()->user()->id)->find($id);

            $booking->delete();

            return response()->json([
                'message' => 'Booking deleted',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e,
            ], 500);
        }
    }

    public function posting($id)
    {
        try {
            DB::beginTransaction();
            $booking = Booking::where('create_by', auth()->user()->id)->find($id);

            $booking->update([
                'status' => 'posting',
            ]);

            // update qty available and qty on booking
            $trado = Trado::find($booking->trado_id);
            if ($trado->qty_available < $booking->qty) {
                return response()->json([
                    'message' => 'Qty available is not enough or fully booked, please decrease the qty or finish the booking',
                ], 500);
            }
            $trado->update([
                'qty_available' => $trado->qty_available - $booking->qty,
                'qty_on_booking' => $trado->qty_on_booking + $booking->qty,
            ]);

            DB::commit();
            return response()->json([
                'message' => 'Booking posted',
                'booking' => $booking,
            ]);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'message' => $e,
            ], 500);
        }
    }

    public function rejected($id)
    {
        try {
            DB::beginTransaction();
            $booking = Booking::where('create_by', auth()->user()->id)->find($id);

            $booking->update([
                'status' => 'rejected',
            ]);
            DB::commit();
            return response()->json([
                'message' => 'Booking rejected',
                'booking' => $booking,
            ]);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'message' => $e,
            ], 500);
        }
    }

    public function finished($id)
    {
        try {
            DB::beginTransaction();
            $booking = Booking::where('create_by', auth()->user()->id)->find($id);

            $booking->update([
                'status' => 'finished',
            ]);
            $trado = Trado::find($booking->trado_id);
            // update qty available and qty on booking
            $trado->update([
                'qty_available' => $trado->qty_available + $booking->qty,
                'qty_on_booking' => $trado->qty_on_booking - $booking->qty,
            ]);
            DB::commit();
            return response()->json([
                'message' => 'Booking finished',
                'booking' => $booking,
            ]);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'message' => $e,
            ], 500);
        }
    }
}
