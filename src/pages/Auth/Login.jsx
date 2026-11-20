import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginSuccess, logout } from '../../stores/authSlice';
import { login } from '../../service/AuthService';

const Login = () => {
    const [email, setEmail] = useState('test@example.com');
    const [password, setPassword] = useState('12345678');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const reduxToken = useSelector((state) => state.auth?.token);
    const sessionToken = sessionStorage.getItem('token');

    useEffect(() => {
        if (!sessionToken && reduxToken) {
            dispatch(logout());
        } else if (sessionToken) {
            navigate('/dashboard', { replace: true });
        }
    }, [sessionToken, reduxToken, navigate, dispatch]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { token, user } = await login(email, password);
            dispatch(loginSuccess({ token, user }));
            navigate('/dashboard');
        } catch (err) {
            setError(
                err.response?.data?.message || 
                err.message || 
                'Login មិនជោគជ័យ សូមពិនិត្យ Email ឬ Password ឡើងវិញ។'
            );
        } finally {
            setLoading(false);
        }
    };

    <style>
        {`
            @keyframes fadeUp {
                from { opacity: 0; transform: translateY(24px); }
                to   { opacity: 1; transform: translateY(0); }
            }
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-6px); }
                75% { transform: translateX(6px); }
            }
            .anim-fade-up { opacity: 0; animation: fadeUp 0.7s ease-out forwards; }
            .anim-shake { animation: shake 0.4s ease-in-out; }
        `}
    </style>

    return (
        <div className="flex min-h-screen w-full bg-[#b2845a]">
            {/* Left Form Section */}
            <div className="flex flex-col justify-center px-8 sm:px-16 lg:px-24 w-full lg:w-1/2 py-12">
                <div className="max-w-md w-full mx-auto">
                    <h1 className=" text-4xl font-serif font-bold text-white mb-2 transition-transform duration-300 cursor-default">
                        Login Dashboard
                    </h1>
                    <p className="anim-fade-up [animation-delay:150ms] text-white/90 text-sm mb-8 font-serif">
                        You need an account to continue.
                    </p>

                    {error && (
                        <div className="anim-shake mb-4 p-3 text-sm text-red-100 bg-red-900/40 rounded-lg border border-red-200/20 font-serif">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">

                        <div className="anim-fade-up [animation-delay:300ms] group">
                            <label className="block text-sm font-serif text-white mb-1.5 transition-all duration-300 group-hover:translate-x-1 group-focus-within:translate-x-1 group-focus-within:font-semibold">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder=""
                                required
                                className="w-full px-4 py-2.5 bg-white border border-transparent rounded-lg text-gray-800 shadow-sm
                                        transition-all duration-300 ease-out
                                        hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20
                                        focus:outline-none focus:ring-2 focus:ring-[#8c5e3c] focus:-translate-y-0.5 focus:shadow-xl focus:scale-[1.02]"
                            />
                        </div>

                        <div className="anim-fade-up [animation-delay:450ms] group">
                            <label className="block text-sm font-serif text-white mb-1.5 transition-all duration-300 group-hover:translate-x-1 group-focus-within:translate-x-1 group-focus-within:font-semibold">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder=""
                                required
                                className="w-full px-4 py-2.5 bg-white border border-transparent rounded-lg text-gray-800 shadow-sm
                                        transition-all duration-300 ease-out
                                        hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20
                                        focus:outline-none focus:ring-2 focus:ring-[#8c5e3c] focus:-translate-y-0.5 focus:shadow-xl focus:scale-[1.02]"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="anim-fade-up [animation-delay:600ms] group relative overflow-hidden w-full py-2.5 px-4 mt-2
                                    bg-[#8c5e3c] text-white font-serif font-medium rounded-lg shadow-md cursor-pointer
                                    transition-all duration-300 ease-out
                                    hover:bg-[#724a2e] hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/40
                                    active:translate-y-0 active:scale-95
                                    focus:outline-none focus:ring-2 focus:ring-white/50
                                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                        >
                            {/* ពន្លឺរំកិលកាត់ពេល hover */}
                            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent
                                            transition-transform duration-700 ease-out group-hover:translate-x-full" />

                            <span className="relative flex items-center justify-center gap-2">
                                {loading ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                        កំពុង Logged in...
                                    </>
                                ) : (
                                    <>
                                        login
                                        <span className="inline-block transition-transform duration-300 group-hover:translate-x-1.5">→</span>
                                    </>
                                )}
                            </span>
                        </button>
                    </form>
                </div>
                
            </div>

            {/* Right Image Section */}
            <div className="group hidden lg:block lg:w-1/2 relative overflow-hidden">
                <img
                    src="https://i.pinimg.com/736x/4e/6a/02/4e6a02caba5f6ff0ad4f53fcd9ad139f.jpg"
                    alt="Coffee pouring"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1500ms] ease-out group-hover:scale-110"
                />
                {/* Overlay ស្រាលៗ ដែលបាត់ពេល hover */}
                <div className="absolute inset-0 bg-[#8c5e3c]/20 transition-opacity duration-700 group-hover:opacity-0" />
            </div>
        </div>
    );
};

export default Login;
