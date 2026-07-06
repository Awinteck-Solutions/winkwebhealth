import { Button } from "@mantine/core";

import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { authPost } from "../services/auth.service";
import { capitalizeWords } from "../../../utils/page.helper";

import { useNavigate } from "react-router-dom";
import { ForgetPasswordModal } from "../components/modals/forgetPasswordModal";

const AdminLoginPage = () => {
    const [submitting, setSubmitting] = useState(false);
    const navigator = useNavigate()

    const validationSchema = Yup.object().shape({
        email: Yup.string().required("Email is required"),
        password: Yup.string().required("Password is required")
    });

    const handleSubmit = async (values) => {
        try {
            navigator('/admin/dashboard/')

            setSubmitting(true);
            // Perform form submission logic here
            console.log(values);

            let response = await authPost('LOGIN', values);
            console.log("submitApi-response :>> ", response);


            if (response.status) {

                notifications.show({
                    title: "Success",
                    message: "Login successfully!",
                    color: "green",
                    position: 'top-right'
                });
                let userConfig = response.data.response
                console.log('userConfig :>> ', userConfig);
                localStorage.setItem('cfg', JSON.stringify(userConfig))
                navigator('/admin/university/')
            } else {
                notifications.show({
                    title: "Error",
                    message: capitalizeWords(response.message),
                    color: "red",
                });

            }
            setSubmitting(false);
        } catch (error) {
            // Handle form submission error
            console.error(error);
            setSubmitting(false);

            notifications.show({
                title: "Error",
                message: 'Invalid Credential',
                color: "red",
            });
        }
    };

    const formik = useFormik({
        initialValues: {
            email: "",
            password: ""
        },
        validationSchema,
        onSubmit: handleSubmit,
    });

    return (
        <>
            <div className="flex items-center justify-center h-screen bg-gray-100">

                <div className="overflow-hidden md:w-1/2 w-11/12 m-auto rounded-2xl pb-10 bg-white">

                    <div className=" p-5 rounded-2xl">
                        <div className="w-fit m-auto flex space-x-2 my-3">
                            <img className="m-auto text-black" src="/icon.svg" alt="" />
                            <p className="font-semibold text-2xl">Template</p>
                        </div>
                        <div className="p-5 text-center">
                            <h2 className="text-sm m-auto px-6 p-1 text-white bg-[#000]/90 rounded-[100px] w-fit">
                                Admin
                            </h2>
                            <p className="text-lg">Sign in with your credentials to continue</p>
                        </div>

                        <form className="space-y-5 mx-5" onSubmit={formik.handleSubmit}>
                            <div className="mx-5  space-y-2">
                                <label htmlFor="email" className="text-gray-600">Email</label>
                                <input
                                    type="email"
                                    className="bg-gray-200 text-black border-0 focus:ring-1 focus:ring-gray-200 focus:outline-none rounded-md p-3 w-full"
                                    placeholder="Email"
                                    value={formik.values.email}
                                    onChange={(e) => {
                                        formik.setFieldValue("email", e.target.value);
                                    }}
                                />
                                {formik.touched.email && formik.errors.email && (
                                    <div className="text-red-500">{formik.errors.email}</div>
                                )}
                            </div>

                            <div className="mx-5 space-y-2">
                                <label htmlFor="password" className="text-gray-600">Password</label>
                                <input
                                    type="password"
                                    className="bg-gray-200 text-black border-0 focus:ring-1 focus:ring-gray-200 focus:outline-none rounded-md p-3 w-full"
                                    placeholder="Password"
                                    value={formik.values.password}
                                    onChange={(e) => {
                                        formik.setFieldValue("password", e.target.value);
                                    }}
                                />
                                {formik.touched.password && formik.errors.password && (
                                    <div className="text-red-500">{formik.errors.password}</div>
                                )}
                            </div>

                            <div className="flex justify-end mx-5">
                                <ForgetPasswordModal>
                                    <p className="hover:underline hover:text-blue-500 duration-200 text-right">Forgot Password?</p>
                                </ForgetPasswordModal>

                            </div>

                            <div className="flex justify-end mx-5">
                                <Button
                                    bg="#000"
                                    color={"white"}
                                    _hover={{ bg: "gray.700" }}
                                    rounded={"lg"}
                                    w={"full"}
                                    mt={4}
                                    py={6}
                                    px={10}
                                    type="submit"
                                >
                                    Login
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdminLoginPage;
