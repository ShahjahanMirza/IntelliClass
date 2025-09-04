import React, { Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Layout from "./components/layout/Layout";
import LoadingSpinner from "./components/LoadingSpinner";
import ErrorBoundary from "./components/ErrorBoundary";

// Lazy load all page components for code splitting
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const Classes = React.lazy(() => import("./pages/Classes"));
const ClassDetail = React.lazy(() => import("./pages/ClassDetail"));
const Calendar = React.lazy(() => import("./pages/Calendar"));
const People = React.lazy(() => import("./pages/People"));
const AssignmentDetail = React.lazy(() => import("./pages/AssignmentDetail"));
const CreateAssignment = React.lazy(() => import("./pages/CreateAssignment"));
const SubmitAssignment = React.lazy(() => import("./pages/SubmitAssignment"));
const ReviewSubmission = React.lazy(() => import("./pages/ReviewSubmission"));
const Login = React.lazy(() => import("./pages/Login"));
const Profile = React.lazy(() => import("./pages/Profile"));
const CreateClass = React.lazy(() => import("./pages/CreateClass"));
const JoinClass = React.lazy(() => import("./pages/JoinClass"));
const ClassStudents = React.lazy(() => import("./pages/ClassStudents"));
const Tickets = React.lazy(() => import("./pages/Tickets"));
const Landing = React.lazy(() => import("./pages/Landing"));
const Notifications = React.lazy(() => import("./pages/Notifications"));
const VideoRoom = React.lazy(() => import("./components/video/VideoRoom"));

import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ErrorProvider } from "./context/ErrorContext";
import { WebRTCProvider } from "./context/WebRTCContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Conditional context wrapper that only loads heavy contexts when authenticated
const ConditionalContextWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  // Don't load heavy contexts until auth is determined and user is authenticated
  if (loading) {
    return <>{children}</>;
  }
  
  if (isAuthenticated) {
    return (
      <NotificationProvider>
        <WebRTCProvider>
          {children}
        </WebRTCProvider>
      </NotificationProvider>
    );
  }
  
  // For unauthenticated users, skip heavy contexts
  return <>{children}</>;
};
function App() {
  return (
    <AuthProvider>
      <ErrorProvider>
        <ConditionalContextWrapper>
          <Router>
            <ToastContainer position="top-right" autoClose={3000} />
            <ErrorBoundary>
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Landing />} /> {/* 👈 Landing page */}
                <Route path="/dashboard" element={<Layout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="classes" element={<Classes />} />
                  <Route path="classes/create" element={<CreateClass />} />
                  <Route path="classes/join" element={<JoinClass />} />
                  <Route
                    path="classes/:classId"
                    element={
                      <ProtectedRoute
                        requireAuth={true}
                        requireClassMember={true}
                        requireClassExists={true}
                      >
                        <ClassDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="classes/:classId/students"
                    element={
                      <ProtectedRoute
                        requireAuth={true}
                        requireTeacher={true}
                        requireClassExists={true}
                      >
                        <ClassStudents />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="classes/:classId/assignments/:assignmentId"
                    element={
                      <ProtectedRoute
                        requireAuth={true}
                        requireClassMember={true}
                        requireClassExists={true}
                      >
                        <AssignmentDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="classes/:classId/create-assignment"
                    element={
                      <ProtectedRoute
                        requireAuth={true}
                        requireTeacher={true}
                        requireClassExists={true}
                      >
                        <CreateAssignment />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="classes/:classId/assignments/:assignmentId/submit"
                    element={
                      <ProtectedRoute
                        requireAuth={true}
                        requireClassMember={true}
                        requireClassExists={true}
                      >
                        <SubmitAssignment />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="classes/:classId/assignments/:assignmentId/submissions/:submissionId"
                    element={
                      <ProtectedRoute
                        requireAuth={true}
                        requireTeacher={true}
                        requireClassExists={true}
                      >
                        <ReviewSubmission />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="calendar" element={<Calendar />} />
                  <Route path="people" element={<People />} />
                  <Route path="tickets" element={<Tickets />} />
                  <Route path="notifications" element={<Notifications />} />
                  <Route path="profile" element={<Profile />} />
                  <Route
                    path="video/:roomId"
                    element={
                      <ProtectedRoute requireAuth={true}>
                        <VideoRoom />
                      </ProtectedRoute>
                    }
                  />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </Router>
        </ConditionalContextWrapper>
      </ErrorProvider>
    </AuthProvider>
  );
}

export default App;
