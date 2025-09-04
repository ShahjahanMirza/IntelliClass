import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from 'lucide-react';
interface BackButtonProps {
  to?: string;
  className?: string;
}
const BackButton: React.FC<BackButtonProps> = ({
  to,
  className = ''
}) => {
  const navigate = useNavigate();
  const handleBack = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };
  return <button onClick={handleBack} className={`flex items-center text-gray-600 hover:text-gray-900 ${className}`}>
      <ArrowLeftIcon className="h-4 w-4 mr-1" />
      <span>Back</span>
    </button>;
};
export default BackButton;