let app = angular.module("MainApp", ["ui.router", "toaster"]);

app.config(function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise(function ($injector, $location) {
        let $state = $injector.get("$state");
        $state.go("/");
        return true;
    });

    $stateProvider
        .state("login", {
            url: "/",
            templateUrl: "html/login.html",
            controller: "LoginController",
        })
        .state("home", {
            url: "/home",
            templateUrl: "html/home.html",
            controller: "HomeController",
        });
});

app.factory("AuthService", function ($http, $state) {
    return {
        getMe: function () {
            return $http({
                method: "GET",
                url: "/me",
            }).then(
                function (response) {
                    if (response.status === 200 && response.data.user != null) {
                        $state.go("home");
                        return response.data;
                    } else {
                        $state.go("login");
                    }
                },
                function (error) {
                    $state.go("login");
                    console.log(error);
                }
            );
        },
    };
});

app.directive("select2", function ($timeout) {
    return {
        restrict: "A",
        require: "ngModel",
        link: function (scope, element, attrs, ngModel) {
            $timeout(function () {
                $(element).select2();

                $(element).on("change", function () {
                    scope.$apply(function () {
                        ngModel.$setViewValue($(element).val());
                    });
                });
            });

            scope.$watch(attrs.ngModel, function (newValue) {
                $(element).val(newValue).trigger("change");
            });

            element.on("$destroy", function () {
                $(element).select2("destroy");
            });
        },
    };
});

app.controller(
    "LoginController",
    function ($scope, $state, $http, toaster, AuthService) {
        $scope.message = "Welcome to Login Page";

        AuthService.getMe().then(function (user) {});

        $scope.email = "admin@gmail.com";
        $scope.password = "password";

        $scope.login = function () {
            $http({
                method: "POST",
                url: "/login",
                data: {
                    email: $scope.email,
                    password: $scope.password,
                },
            }).then(
                function (response) {
                    if (response.status === 200) {
                        toaster.pop("success", "Login", "Login Successfully");
                        setTimeout(function () {
                            $state.go("home");
                        }, 1000);
                    } else {
                        toaster.pop(
                            "error",
                            "Login Failed",
                            "Invalid Credentials"
                        );
                    }
                },
                function (error) {
                    toaster.pop("error", "Error", error.data.message);
                }
            );
        };
    }
);

app.controller(
    "HomeController",
    function ($scope, $http, AuthService, toaster, $state, $compile) {
        flatpickr(".flatpickr-date", {
            locale: "id",
            dateFormat: "d-m-Y",
        });

        flatpickr(".flatpickr-time", {
            enableTime: true,
            noCalendar: true,
            time_24hr: true,
            locale: "id",
            dateFormat: "H:i",
        });

        $scope.formData = {
            form_check_in: moment().format("DD-MM-YYYY"),
            form_time_in: moment().format("HH:mm"),
            qty: 1,
        };

        AuthService.getMe().then(function (user) {
            $scope.logout = function () {
                $http({
                    method: "POST",
                    url: "/logout",
                    headers: {
                        "X-CSRF-TOKEN": user.csrf_token,
                    },
                }).then(
                    function (response) {
                        if (response.status === 200) {
                            toaster.pop(
                                "success",
                                "Logout",
                                "Logout Successfully"
                            );
                            setTimeout(function () {
                                $state.go("login");
                            }, 1000);
                        } else {
                            toaster.pop(
                                "error",
                                "Logout Failed",
                                "Invalid Credentials"
                            );
                        }
                    },
                    function (error) {
                        toaster.pop("error", "Error", error.data.message);
                    }
                );
            };

            table = $("#datatables").DataTable({
                processing: true,
                serverSide: true,
                order: [[0, "desc"]],
                ajax: {
                    headers: {
                        "X-CSRF-TOKEN": user.csrf_token,
                    },
                    url: "/bookings/datatable",
                    type: "POST",
                    data: function (d) {
                        return d;
                    },
                },
                columns: [
                    { data: "id", name: "id", visible: false },
                    { data: "code", name: "code" },
                    { data: "trado.name", name: "trado.name" },
                    { data: "check_in", name: "check_in" },
                    { data: "check_out", name: "check_out" },
                    { data: "status", name: "status" },
                    { data: "qty", name: "qty" },
                    { data: "action", name: "action" },
                ],
                drawCallback: function (settings) {
                    $compile($("#datatables").contents())($scope);
                },
            });

            $scope.detailBooking = function (id) {
                $http.get("/bookings/" + id).then(function (response) {
                    $scope.detail = response.data.booking;
                    $scope.detail.check_in = moment(
                        $scope.detail.check_in
                    ).format("LL");
                    $scope.detail.check_out = moment(
                        $scope.detail.check_out
                    ).format("LL");
                    $scope.detail.created_at = moment(
                        $scope.detail.created_at
                    ).format("LLLL");
                    console.log(id, $scope.detail);
                    $("#detailBookingModal").modal("show");
                });
            };

            $scope.addBooking = function () {
                $scope.nameModal = "Add Booking";
                $scope.formData = {
                    form_check_in: moment().format("DD-MM-YYYY"),
                    qty: 1,
                    trado_id: null,
                };
                $("#addBookingModal").modal("show");
            };

            $scope.editBooking = function (id) {
                $http.get("/bookings/" + id).then(function (response) {
                    $scope.response = response.data.booking;
                    $scope.formData = {};
                    $scope.formData.qty = $scope.response.qty;
                    $scope.formData.trado_id = $scope.response.trado_id;
                    $scope.formData.form_check_in = moment(
                        $scope.response.check_in
                    ).format("DD-MM-YYYY");
                    $scope.formData.form_check_out = moment(
                        $scope.response.check_out
                    ).format("DD-MM-YYYY");
                    $scope.nameModal = "Edit Booking";
                    $("#addBookingModal").modal("show");
                });
            };

            $scope.submitBooking = function () {
                if ($scope.formData.trado_id == null) {
                    toaster.pop("warning", "Warning", "Trado is required");
                    return;
                }

                if ($scope.formData.form_check_in) {
                    // &&
                    // $scope.formData.form_time_in
                    let check_in_date = moment(
                        $scope.formData.form_check_in,
                        "DD-MM-YYYY"
                    ).format("YYYY-MM-DD");
                    // let check_in_time = moment(
                    //     $scope.formData.form_time_in,
                    //     "HH:mm"
                    // ).format("HH:mm:ss");
                    $scope.formData.check_in = check_in_date;
                    // + " " + check_in_time
                } else {
                    toaster.pop(
                        "warning",
                        "Warning",
                        "Check In Date is required"
                    );
                    return;
                }

                if ($scope.formData.form_check_out) {
                    // &&
                    // $scope.formData.form_time_out
                    let check_out_date = moment(
                        $scope.formData.form_check_out,
                        "DD-MM-YYYY"
                    ).format("YYYY-MM-DD");
                    // let check_out_time = moment(
                    //     $scope.formData.form_time_out,
                    //     "HH:mm"
                    // ).format("HH:mm:ss");
                    $scope.formData.check_out = check_out_date;
                    // + " " + check_out_time
                } else {
                    toaster.pop(
                        "warning",
                        "Warning",
                        "Check Out Date is required"
                    );
                    return;
                }

                if ($scope.formData.check_in > $scope.formData.check_out) {
                    toaster.pop(
                        "warning",
                        "Warning",
                        "Tanggal Check In tidak boleh lebih besar dari Check Out"
                    );
                    return;
                }

                if ($scope.nameModal == "Add Booking") {
                    $http({
                        method: "POST",
                        url: "/bookings",
                        headers: {
                            "X-CSRF-TOKEN": user.csrf_token,
                        },
                        data: $scope.formData,
                    }).then(
                        function (response) {
                            if (response.status === 200) {
                                toaster.pop(
                                    "success",
                                    "Booking",
                                    "Booking Created Successfully"
                                );
                                setTimeout(function () {
                                    $("#addBookingModal").modal("hide");
                                    table.ajax.reload();
                                    $scope.getTrado()
                                    // $state.reload();
                                }, 300);
                            } else {
                                toaster.pop(
                                    "error",
                                    "Booking Failed",
                                    "Booking Created Failed"
                                );
                            }
                        },
                        function (error) {
                            toaster.pop("error", "Error", error.data.message);
                        }
                    );
                } else {
                    $http({
                        method: "PUT",
                        url: "/bookings/" + $scope.response.id,
                        headers: {
                            "X-CSRF-TOKEN": user.csrf_token,
                        },
                        data: $scope.formData,
                    }).then(
                        function (response) {
                            if (response.status === 200) {
                                toaster.pop(
                                    "success",
                                    "Booking",
                                    "Booking Updated Successfully"
                                );
                                setTimeout(function () {
                                    $("#addBookingModal").modal("hide");
                                    table.ajax.reload();
                                    $scope.getTrado()
                                    // $state.reload();
                                }, 300);
                            } else {
                                toaster.pop(
                                    "error",
                                    "Booking Failed",
                                    "Booking Updated Failed"
                                );
                            }
                        },
                        function (error) {
                            toaster.pop("error", "Error", error.data.message);
                        }
                    );
                }
            };

            $scope.deleteBooking = function (id) {
                if (confirm("Are you sure want to delete this booking?")) {
                    $http({
                        method: "DELETE",
                        url: "/bookings/" + id,
                        headers: {
                            "X-CSRF-TOKEN": user.csrf_token,
                        },
                    }).then(
                        function (response) {
                            if (response.status === 200) {
                                toaster.pop(
                                    "success",
                                    "Booking",
                                    "Booking Deleted Successfully"
                                );
                                setTimeout(function () {
                                    table.ajax.reload();
                                    $scope.getTrado()
                                }, 300);
                            } else {
                                toaster.pop(
                                    "error",
                                    "Booking Failed",
                                    "Booking Deleted Failed"
                                );
                            }
                        },
                        function (error) {
                            toaster.pop("error", "Error", error.data.message);
                        }
                    );
                }
            };

            $scope.postingBooking = function (id) {
                if (confirm("Are you sure want to posting this booking?")) {
                    $http({
                        method: "POST",
                        url: "/bookings/posting/" + id,
                        headers: {
                            "X-CSRF-TOKEN": user.csrf_token,
                        },
                    }).then(
                        function (response) {
                            if (response.status === 200) {
                                toaster.pop(
                                    "success",
                                    "Booking",
                                    "Booking Posted Successfully"
                                );
                                $("#detailBookingModal").modal("hide");
                                setTimeout(function () {
                                    table.ajax.reload();
                                    $scope.getTrado()
                                }, 300);
                            } else {
                                toaster.pop(
                                    "error",
                                    "Booking Failed",
                                    "Booking Posted Failed"
                                );
                            }
                        },
                        function (error) {
                            toaster.pop("error", "Error", error.data.message);
                        }
                    );
                }
            };

            $scope.rejectBooking = function (id) {
                if (confirm("Are you sure want to reject this booking?")) {
                    $http({
                        method: "POST",
                        url: "/bookings/rejected/" + id,
                        headers: {
                            "X-CSRF-TOKEN": user.csrf_token,
                        },
                    }).then(
                        function (response) {
                            if (response.status === 200) {
                                toaster.pop(
                                    "success",
                                    "Booking",
                                    "Booking Rejected Successfully"
                                );
                                $("#detailBookingModal").modal("hide");
                                setTimeout(function () {
                                    table.ajax.reload();
                                    $scope.getTrado()
                                }, 300);
                            } else {
                                toaster.pop(
                                    "error",
                                    "Booking Failed",
                                    "Booking Rejected Failed"
                                );
                            }
                        },
                        function (error) {
                            toaster.pop("error", "Error", error.data.message);
                        }
                    );
                }
            };

            $scope.finishBooking = function (id) {
                if (confirm("Are you sure want to finish this booking?")) {
                    $http({
                        method: "POST",
                        url: "/bookings/finished/" + id,
                        headers: {
                            "X-CSRF-TOKEN": user.csrf_token,
                        },
                    }).then(
                        function (response) {
                            if (response.status === 200) {
                                toaster.pop(
                                    "success",
                                    "Booking",
                                    "Booking Finished Successfully"
                                );
                                $("#detailBookingModal").modal("hide");
                                setTimeout(function () {
                                    table.ajax.reload();
                                    $scope.getTrado()
                                }, 300);
                            } else {
                                toaster.pop(
                                    "error",
                                    "Booking Failed",
                                    "Booking Finished Failed"
                                );
                            }
                        },
                        function (error) {
                            toaster.pop("error", "Error", error.data.message);
                        }
                    );
                }
            };
        });

        $scope.getTrado = function () {
            $http.get("/trados").then(function (response) {
                $scope.trados = response.data.data;
                console.log($scope.trados);
            });
        };
        $scope.getTrado();
    }
);
