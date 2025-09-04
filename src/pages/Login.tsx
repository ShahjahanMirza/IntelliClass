// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { BookOpenIcon, EyeIcon, EyeOffIcon } from "lucide-react";
// import { useAuth } from "../context/AuthContext";
// import { toast } from "react-toastify";

// const Login = () => {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [name, setName] = useState("");
//   const [isLogin, setIsLogin] = useState(true);
//   const [showPassword, setShowPassword] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const { login, signup, loading: authLoading } = useAuth();
//   const navigate = useNavigate();

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsLoading(true);

//     try {
//       if (isLogin) {
//         await login(email, password);
//         toast.success("Login successful!");
//         navigate("/dashboard");
//       } else {
//         if (!name.trim()) {
//           toast.error("Please enter your name");
//           return;
//         }
//         await signup(email, password, name);
//         toast.success(
//           "Account created! Please check your email to confirm your account."
//         );
//         setIsLogin(true);
//       }
//     } catch (error: any) {
//       console.error("Auth error:", error);
//       toast.error(error.message || "Authentication failed");
//     } finally {
//       setIsLoading(false);
//     }
//   };
//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
//       <div className="max-w-md w-full space-y-8">
//         <div className="text-center">
//           <div className="flex justify-center">
//             <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-4 rounded-2xl shadow-lg inline-block">
//               <BookOpenIcon className="h-10 w-10 text-white" />
//             </div>
//           </div>
//           <h1 className="mt-6 text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
//             EduAI
//           </h1>
//           <h2 className="mt-2 text-xl font-semibold text-gray-900">
//             Smart Learning Platform
//           </h2>
//           <p className="mt-2 text-sm text-gray-600">
//             {isLogin
//               ? "Sign in to your account"
//               : "Create your account and start teaching or learning"}
//           </p>
//         </div>
//         <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
//           <div className="rounded-md shadow-sm space-y-4">
//             {!isLogin && (
//               <div>
//                 <label htmlFor="name" className="sr-only">
//                   Full Name
//                 </label>
//                 <input
//                   id="name"
//                   name="name"
//                   type="text"
//                   autoComplete="name"
//                   required={!isLogin}
//                   className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
//                   placeholder="Full Name"
//                   value={name}
//                   onChange={(e) => setName(e.target.value)}
//                 />
//               </div>
//             )}

//             <div>
//               <label htmlFor="email" className="sr-only">
//                 Email address
//               </label>
//               <input
//                 id="email"
//                 name="email"
//                 type="email"
//                 autoComplete="email"
//                 required
//                 className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
//                 placeholder="Email address"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//               />
//             </div>

//             <div className="relative">
//               <label htmlFor="password" className="sr-only">
//                 Password
//               </label>
//               <input
//                 id="password"
//                 name="password"
//                 type={showPassword ? "text" : "password"}
//                 autoComplete={isLogin ? "current-password" : "new-password"}
//                 required
//                 className="appearance-none rounded-md relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
//                 placeholder="Password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//               />
//               <button
//                 type="button"
//                 className="absolute inset-y-0 right-0 pr-3 flex items-center"
//                 onClick={() => setShowPassword(!showPassword)}
//               >
//                 {showPassword ? (
//                   <EyeOffIcon className="h-4 w-4 text-gray-400" />
//                 ) : (
//                   <EyeIcon className="h-4 w-4 text-gray-400" />
//                 )}
//               </button>
//             </div>
//           </div>
//           <div>
//             <button
//               type="submit"
//               className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
//               disabled={isLoading || authLoading}
//             >
//               {isLoading
//                 ? isLogin
//                   ? "Signing in..."
//                   : "Creating account..."
//                 : isLogin
//                 ? "Sign in"
//                 : "Create account"}
//             </button>
//           </div>

//           <div className="text-sm text-center">
//             <button
//               type="button"
//               className="text-blue-600 hover:text-blue-500 block w-full"
//               onClick={() => {
//                 setIsLogin(!isLogin);
//                 setEmail("");
//                 setPassword("");
//                 setName("");
//               }}
//             >
//               {isLogin
//                 ? "Don't have an account? Sign up"
//                 : "Already have an account? Sign in"}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };
// export default Login;

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, User, Fingerprint, AtSign } from "lucide-react";
import ScrollToTopButton from '../components/ScrollToTopButton';
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, signup, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        toast.success("Login successful!");
        navigate("/dashboard");
      } else {
        if (!name.trim()) {
          toast.error("Please enter your name");
          return;
        }
        await signup(email, password, name);
        toast.success(
          "Account created! Please check your email to confirm your account."
        );
        setIsLogin(true);
      }
    } catch (error) {
      console.error("Auth error:", error);
      toast.error(error.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-8">
        {/* Logo and Title */}
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <img
              className="mr-2"
              src="IntelliClass.jpg"
              alt="Logo"
              width="40"
            />
            <span className="text-xl font-semibold text-gray-900">
              IntelliClass
            </span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isLogin
              ? "Sign in to IntelliClass"
              : "Create your IntelliClass account"}
          </h1>

          <p className="text-gray-600">
            {isLogin ? (
              <>
                Don't have an account?{" "}
                <button
                  onClick={() => {
                    setIsLogin(false);
                    setEmail("");
                    setPassword("");
                    setName("");
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Create a free account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => {
                    setIsLogin(true);
                    setEmail("");
                    setPassword("");
                    setName("");
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Name Field (only for signup) */}
          {!isLogin && (
            <div>
              <div className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </div>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required={!isLogin}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-950 focus:border-transparent outline-none transition-all placeholder-gray-400"
                />
              </div>
            </div>
          )}

          {/* Email Field */}
          <div>
            <div className="block text-sm font-medium text-gray-700 mb-2">
              Email address
            </div>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email to get started"
                required
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-950 focus:border-transparent outline-none transition-all placeholder-gray-400"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="block text-sm font-medium text-gray-700">
                Password
              </div>
              {/* {isLogin && (
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Forgot password?
                </button>
              )} */}
            </div>
            <div className="relative">
              <Fingerprint className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-950 focus:border-transparent outline-none transition-all placeholder-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isLoading || authLoading}
            className="w-full bg-green-950 text-white font-semibold py-3 px-4 rounded-lg transform hover:scale-[0.98] transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading
              ? isLogin
                ? "Signing in..."
                : "Creating account..."
              : isLogin
              ? "Sign in"
              : "Create account"}
          </button>
        </div>

        {/* Back to Homepage Link */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate("/")}
            className="text-gray-500 hover:text-gray-700 text-sm font-medium"
          >
            Back to homepage
          </button>
        </div>
      </div>
      <ScrollToTopButton />
    </div>
  );
};

export default Login;
