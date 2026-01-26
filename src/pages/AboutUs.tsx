import { ArrowLeft, Shield, Users, MessageCircle, Video, CheckCircle, Star, Lock, Globe } from 'lucide-react';
import { Button } from '../components/ui/button';

interface AboutUsProps {
  onBack: () => void;
}

export default function AboutUs({ onBack }: AboutUsProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Button variant="ghost" onClick={onBack} className="mb-4 text-white hover:bg-white/20">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
        <div className="max-w-4xl mx-auto px-4 pb-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About PrivateConnect</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Sri Lanka's Premier Verified Classified Ads Platform for Trusted Connections
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8 -mt-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Our Mission</h2>
          <p className="text-gray-700 text-lg leading-relaxed text-center">
            PrivateConnect is dedicated to providing a safe, secure, and trusted platform for adults in Sri Lanka to connect with verified profiles. We prioritize user safety, privacy, and quality connections through our rigorous verification process and premium features.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Admin Verified Profiles</h3>
            <p className="text-gray-600">
              Every profile on our platform is manually reviewed and verified by our admin team to ensure authenticity and safety for all users.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Privacy Protected</h3>
            <p className="text-gray-600">
              Your privacy is our priority. We use advanced security measures to protect your personal information and ensure secure communications.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <MessageCircle className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Free Chat & Voice Calls</h3>
            <p className="text-gray-600">
              Enjoy unlimited free chat messaging and voice calls with verified profiles. Connect instantly without any hidden charges.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <Video className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Premium Video Calls</h3>
            <p className="text-gray-600">
              Upgrade to premium for high-quality video calls and WhatsApp access. Experience face-to-face connections with enhanced features.
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Why Choose PrivateConnect?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">100% Verified</h4>
              <p className="text-gray-600 text-sm">All profiles are admin-approved for authenticity</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <Star className="w-8 h-8 text-yellow-500" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Premium Quality</h4>
              <p className="text-gray-600 text-sm">High-quality profiles with detailed information</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <Globe className="w-8 h-8 text-blue-500" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Island Wide</h4>
              <p className="text-gray-600 text-sm">Connect with profiles from across Sri Lanka</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-pink-50 rounded-lg p-4 text-center">
              <Users className="w-8 h-8 text-pink-500 mx-auto mb-2" />
              <span className="text-gray-700 font-medium">Girls Personal</span>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <span className="text-gray-700 font-medium">Boys Personal</span>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <Video className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <span className="text-gray-700 font-medium">Live Cam</span>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <Star className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <span className="text-gray-700 font-medium">Spa Services</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-600 text-white rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Connect?</h2>
          <p className="text-blue-100 mb-6 max-w-lg mx-auto">
            Join thousands of verified users on Sri Lanka's most trusted classified ads platform. Register today and start making genuine connections.
          </p>
          <Button onClick={onBack} className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 text-lg font-semibold">
            Browse Profiles
          </Button>
        </div>

        <div className="mt-12 text-center text-gray-600">
          <p className="text-sm">
            PrivateConnect is an 18+ platform. All users must be adults to register and use our services.
          </p>
          <p className="text-sm mt-2">
            Contact us: support@privateconnect.lk | www.privateconnect.lk
          </p>
        </div>
      </div>
    </div>
  );
}
