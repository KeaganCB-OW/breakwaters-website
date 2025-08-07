import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate login API call
    setTimeout(() => {
      console.log("Login attempt:", { email, password });
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 sm:px-6 lg:px-8" style={{ backgroundColor: "#EEECE0" }}>
      {/* Background Octopus Illustration */}
      <div className="absolute inset-0 hidden lg:block overflow-hidden">
        <img
          src="https://cdn.builder.io/api/v1/image/assets%2F68d17522cc864801b469948414c206c3%2F58879a35fe63411fb399e8a4fd9652b4"
          alt="Octopus illustration"
          className="absolute right-0 top-1/2 transform -translate-y-1/2 h-full w-auto object-cover opacity-80"
          style={{ maxWidth: "60vw" }}
        />
      </div>

      {/* Centered Login Form */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-lg p-8 lg:p-12">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <svg
              width="94"
              height="97"
              viewBox="0 0 94 97"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-16 h-16 lg:w-20 lg:h-20"
            >
              <g clipPath="url(#clip0_48_115)">
                <path
                  d="M59.0125 77.4052C47.3171 76.2526 35.3941 68.5786 31.6597 57.0523C29.4388 50.7775 28.8358 43.2885 32.158 37.3157C33.5731 34.8687 35.7694 32.4956 38.3903 31.269C40.9496 30.517 45.5945 30.7697 48.0062 32.1751C48.5168 32.5203 49.9934 33.3894 49.4335 34.0982C48.9967 34.5112 48.2584 34.7208 47.717 35.0659C39.9283 40.3422 39.9837 51.9794 44.7886 59.2527C53.6663 72.9549 72.935 75.5314 87.5035 70.7853C88.0388 70.6866 88.4202 70.5942 88.5371 70.8962C88.654 71.1612 88.5248 71.642 88.2664 72.0427C80.8714 83.6122 70.1604 91.8963 58.385 95.2864C46.7388 98.8306 33.0932 96.8212 22.4314 89.7513C-17.9519 64.2454 -0.227329 0.0616017 47.1203 -3.651e-05C68.7454 -0.160296 88.1618 15.9643 92.8314 37.0199C94.7632 45.7602 94.5725 56.9352 90.1798 65.3488C78.6566 74.237 53.7708 70.9825 47.0957 57.1324C43.9027 51.3816 45.3484 43.2392 49.1505 38.0431C53.2417 32.7483 60.9628 32.3847 67.0535 34.7208C70.3327 36.0152 71.9076 38.0431 73.8025 40.9955C74.4608 42.0557 76.3926 41.6242 76.7494 40.7921C77.8138 38.2341 75.8143 34.6838 74.793 32.3415C72.5844 27.5892 67.1766 22.7814 63.0915 20.47C41.977 9.0731 13.0307 22.9355 9.55473 47.1039C9.39477 47.936 9.78851 47.936 10.0961 47.11C12.2802 39.9353 19.9335 30.1595 27.1624 27.0776C30.2201 25.8633 34.1268 25.0497 37.2829 24.908C35.8863 26.4489 33.327 28.2672 31.9981 29.95C28.7005 34.24 26.3134 38.7827 25.3229 44.176C24.4739 49.1564 24.2094 54.4203 26.1165 58.9569C32.8348 76.1231 50.1287 81.6829 67.0228 78.8907C67.5949 78.7674 71.2124 78.3483 69.822 77.4792C66.3952 77.2819 62.4947 77.775 59.1171 77.4052L59.0125 77.3929V77.4052Z"
                  fill="#082658"
                />
              </g>
              <defs>
                <clipPath id="clip0_48_115">
                  <rect width="94" height="97" fill="white" />
                </clipPath>
              </defs>
            </svg>
          </div>

          <h1 className="text-3xl lg:text-4xl font-normal text-[#082658] mb-2" style={{ fontFamily: "Montagu Slab, serif" }}>
            Breakwaters
          </h1>
          <p className="text-xl lg:text-2xl text-[#082658]" style={{ fontFamily: "Montagu Slab, serif" }}>
            Log into your account
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="email" className="text-[#082658] text-lg font-normal mb-2 block">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full h-12 px-4 border border-[#082658]/50 bg-[#D9D9D9]/10 backdrop-blur-sm rounded-xl text-[#082658]/75 placeholder:text-[#082658]/75 focus:ring-2 focus:ring-[#082658] focus:border-transparent"
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-[#082658] text-lg font-normal mb-2 block">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full h-12 px-4 border border-[#082658]/50 bg-[#D9D9D9]/10 backdrop-blur-sm rounded-xl text-[#082658]/75 placeholder:text-[#082658]/75 focus:ring-2 focus:ring-[#082658] focus:border-transparent"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 bg-[#082658] hover:bg-[#082658]/90 text-white font-bold text-lg rounded-xl"
          >
            {isLoading ? "Logging in..." : "Log In"}
          </Button>
        </form>

        {/* Forgot Password */}
        <div className="text-center mt-6">
          <Link
            to="/forgot-password"
            className="text-[#082658] text-lg hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#082658]"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-4 text-[#082658] text-lg">or</span>
          </div>
        </div>

        {/* Social Login */}
        <div className="flex justify-center space-x-4 mb-8">
          <button className="w-16 h-16 bg-gray-300 rounded-full hover:bg-gray-400 transition-colors"></button>
          <button className="w-16 h-16 bg-gray-300 rounded-full hover:bg-gray-400 transition-colors"></button>
          <button className="w-16 h-16 bg-gray-300 rounded-full hover:bg-gray-400 transition-colors"></button>
        </div>

        {/* Sign Up Link */}
        <div className="text-center">
          <span className="text-[#082658] text-lg">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="font-bold hover:underline"
              style={{ fontFamily: "Montagu Slab, serif" }}
            >
              Sign up
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}
