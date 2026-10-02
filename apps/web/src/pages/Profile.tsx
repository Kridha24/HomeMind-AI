import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Profile route seamlessly delegates to the Settings Control Center Profile tab
 */
export const Profile: React.FC = () => {
  return <Navigate to="/settings?tab=profile" replace />;
};

export default Profile;
