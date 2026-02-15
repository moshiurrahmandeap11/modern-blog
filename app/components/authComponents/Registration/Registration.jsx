"use client";


import { CheckCircle, Eye, EyeOff, Lock, Mail, User, UserPlus, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import axiosInstance from "../../sharedComponents/AxiosInstance/AxiosInstance";

const Registration = () => {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [agreeTerms, setAgreeTerms] = useState(false);

    // Password strength indicators
    const [passwordStrength, setPasswordStrength] = useState({
        hasMinLength: false,
        hasUpperCase: false,
        hasLowerCase: false,
        hasNumber: false,
        hasSpecialChar: false,
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear error when user starts typing
        if (error) setError("");
        if (success) setSuccess("");

        // Check password strength
        if (name === "password") {
            setPasswordStrength({
                hasMinLength: value.length >= 8,
                hasUpperCase: /[A-Z]/.test(value),
                hasLowerCase: /[a-z]/.test(value),
                hasNumber: /[0-9]/.test(value),
                hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(value),
            });
        }
    };

    const validateForm = () => {
        // Name validation
        if (!formData.name.trim()) {
            setError("Name is required");
            return false;
        }
        if (formData.name.trim().length < 2) {
            setError("Name must be at least 2 characters long");
            return false;
        }

        // Email validation
        if (!formData.email.trim()) {
            setError("Email is required");
            return false;
        }
        if (!/\S+@\S+\.\S+/.test(formData.email)) {
            setError("Please enter a valid email address");
            return false;
        }

        // Password validation
        if (!formData.password) {
            setError("Password is required");
            return false;
        }
        if (formData.password.length < 8) {
            setError("Password must be at least 8 characters long");
            return false;
        }
        if (!/[A-Z]/.test(formData.password)) {
            setError("Password must contain at least one uppercase letter");
            return false;
        }
        if (!/[a-z]/.test(formData.password)) {
            setError("Password must contain at least one lowercase letter");
            return false;
        }
        if (!/[0-9]/.test(formData.password)) {
            setError("Password must contain at least one number");
            return false;
        }

        // Confirm password validation
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return false;
        }

        // Terms agreement
        if (!agreeTerms) {
            setError("You must agree to the Terms and Conditions");
            return false;
        }

        return true;
    };

    const getPasswordStrengthScore = () => {
        const requirements = Object.values(passwordStrength);
        const metCount = requirements.filter(Boolean).length;
        return (metCount / requirements.length) * 100;
    };

    const getPasswordStrengthColor = () => {
        const score = getPasswordStrengthScore();
        if (score < 40) return "bg-red-500";
        if (score < 60) return "bg-orange-500";
        if (score < 80) return "bg-yellow-500";
        return "bg-green-500";
    };

    const getPasswordStrengthText = () => {
        const score = getPasswordStrengthScore();
        if (score < 40) return "Weak";
        if (score < 60) return "Fair";
        if (score < 80) return "Good";
        return "Strong";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;

        setIsLoading(true);
        setError("");

        try {
            const response = await axiosInstance.post("/users/registration", {
                name: formData.name.trim(),
                email: formData.email.toLowerCase(),
                password: formData.password
            });

            if (response.data.success) {
                setSuccess("Account created successfully! Redirecting to login...");
                
                // Clear form
                setFormData({
                    name: "",
                    email: "",
                    password: "",
                    confirmPassword: "",
                });
                
                // Redirect to login after 2 seconds
                setTimeout(() => {
                    router.push("/login");
                }, 2000);
            }
        } catch (error) {
            console.error("Registration error:", error);
            
            if (error.response) {
                switch (error.response.status) {
                    case 409:
                        setError("User already exists with this email");
                        break;
                    case 400:
                        setError(error.response.data?.message || "Invalid input data");
                        break;
                    case 429:
                        setError("Too many registration attempts. Please try again later");
                        break;
                    default:
                        setError(error.response.data?.message || "Registration failed. Please try again");
                }
            } else if (error.request) {
                setError("Network error. Please check your connection");
            } else {
                setError("An unexpected error occurred");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen text-black bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4 sm:p-6">
            {/* Main Container */}
            <div className="w-full max-w-md">
                {/* Logo/Brand */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
                            Modern Blog
                        </h1>
                    </Link>
                    <p className="text-gray-600 mt-2">Create your account and start your journey</p>
                </div>

                {/* Registration Card */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* Decorative header with gradient */}
                    <div className="h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500"></div>
                    
                    <div className="p-6 sm:p-8">
                        {/* Success Message */}
                        {success && (
                            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg animate-slideDown">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                                    <p className="text-sm text-green-700">{success}</p>
                                </div>
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg animate-shake">
                                <div className="flex items-center gap-3">
                                    <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            </div>
                        )}

                        {/* Registration Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Name Field */}
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Full Name
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="John Doe"
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                                        disabled={isLoading}
                                        autoComplete="name"
                                    />
                                </div>
                            </div>

                            {/* Email Field */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Email Address
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                                    </div>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="you@example.com"
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                                        disabled={isLoading}
                                        autoComplete="email"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Password
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                                        disabled={isLoading}
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center focus:outline-none"
                                        tabIndex="-1"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                                        ) : (
                                            <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                                        )}
                                    </button>
                                </div>

                                {/* Password Strength Indicator */}
                                {formData.password && (
                                    <div className="mt-3 space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-gray-600">Password strength:</span>
                                            <span className={`font-medium ${
                                                getPasswordStrengthScore() < 40 ? 'text-red-500' :
                                                getPasswordStrengthScore() < 60 ? 'text-orange-500' :
                                                getPasswordStrengthScore() < 80 ? 'text-yellow-500' :
                                                'text-green-500'
                                            }`}>
                                                {getPasswordStrengthText()}
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full ${getPasswordStrengthColor()} transition-all duration-300`}
                                                style={{ width: `${getPasswordStrengthScore()}%` }}
                                            ></div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="flex items-center gap-1">
                                                {passwordStrength.hasMinLength ? 
                                                    <CheckCircle className="h-3 w-3 text-green-500" /> : 
                                                    <XCircle className="h-3 w-3 text-gray-300" />
                                                }
                                                <span className={passwordStrength.hasMinLength ? "text-green-700" : "text-gray-500"}>
                                                    8+ characters
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {passwordStrength.hasUpperCase ? 
                                                    <CheckCircle className="h-3 w-3 text-green-500" /> : 
                                                    <XCircle className="h-3 w-3 text-gray-300" />
                                                }
                                                <span className={passwordStrength.hasUpperCase ? "text-green-700" : "text-gray-500"}>
                                                    Uppercase
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {passwordStrength.hasLowerCase ? 
                                                    <CheckCircle className="h-3 w-3 text-green-500" /> : 
                                                    <XCircle className="h-3 w-3 text-gray-300" />
                                                }
                                                <span className={passwordStrength.hasLowerCase ? "text-green-700" : "text-gray-500"}>
                                                    Lowercase
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {passwordStrength.hasNumber ? 
                                                    <CheckCircle className="h-3 w-3 text-green-500" /> : 
                                                    <XCircle className="h-3 w-3 text-gray-300" />
                                                }
                                                <span className={passwordStrength.hasNumber ? "text-green-700" : "text-gray-500"}>
                                                    Number
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 col-span-2">
                                                {passwordStrength.hasSpecialChar ? 
                                                    <CheckCircle className="h-3 w-3 text-green-500" /> : 
                                                    <XCircle className="h-3 w-3 text-gray-300" />
                                                }
                                                <span className={passwordStrength.hasSpecialChar ? "text-green-700" : "text-gray-500"}>
                                                    Special character (!@#$%^&*)
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password Field */}
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Confirm Password
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                                    </div>
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className={`block w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white ${
                                            formData.confirmPassword && formData.password !== formData.confirmPassword
                                                ? 'border-red-300 bg-red-50'
                                                : formData.confirmPassword && formData.password === formData.confirmPassword
                                                ? 'border-green-300 bg-green-50'
                                                : 'border-gray-300'
                                        }`}
                                        disabled={isLoading}
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center focus:outline-none"
                                        tabIndex="-1"
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                                        ) : (
                                            <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                                        )}
                                    </button>
                                </div>
                                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                    <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
                                )}
                            </div>

                            {/* Terms and Conditions */}
                            <div className="flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    id="terms"
                                    checked={agreeTerms}
                                    onChange={(e) => setAgreeTerms(e.target.checked)}
                                    className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                                    disabled={isLoading}
                                />
                                <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer">
                                    I agree to the{" "}
                                    <Link href="/terms" className="text-purple-600 hover:text-purple-800 font-medium transition-colors">
                                        Terms of Service
                                    </Link>{" "}
                                    and{" "}
                                    <Link href="/privacy" className="text-purple-600 hover:text-purple-800 font-medium transition-colors">
                                        Privacy Policy
                                    </Link>
                                </label>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95 shadow-lg shadow-purple-500/25"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Creating account...</span>
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="h-5 w-5" />
                                        <span>Create Account</span>
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Login Link */}
                        <div className="mt-6 text-center text-sm">
                            <span className="text-gray-600">Already have an account? </span>
                            <Link
                                href="/login"
                                className="text-purple-600 hover:text-purple-800 font-medium transition-colors"
                            >
                                Sign in
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Footer Links */}
                <div className="mt-6 text-center text-xs text-gray-500">
                    <Link href="/about" className="hover:text-gray-700 transition-colors mx-2">
                        About
                    </Link>
                    •
                    <Link href="/contact" className="hover:text-gray-700 transition-colors mx-2">
                        Contact
                    </Link>
                    •
                    <Link href="/help" className="hover:text-gray-700 transition-colors mx-2">
                        Help
                    </Link>
                </div>
            </div>

            {/* Add custom animations */}
            <style jsx>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
                    20%, 40%, 60%, 80% { transform: translateX(2px); }
                }
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }
                .animate-slideDown {
                    animation: slideDown 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default Registration;