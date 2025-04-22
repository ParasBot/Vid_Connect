import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Profile from "@/pages/profile";
import EditProfile from "@/pages/edit-profile";
import Communities from "@/pages/communities";
import Community from "@/pages/community";
import CreateCommunity from "@/pages/create-community";
import Messages from "@/pages/messages";
import Search from "@/pages/search";
import Notifications from "@/pages/notifications";
import NotFound from "@/pages/not-found";

function Router() {
  const [location] = useLocation();
  
  const isAuthPage = location === "/login" || location === "/register";

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/profile/:id">
        {params => <Profile id={parseInt(params.id)} />}
      </Route>
      <Route path="/edit-profile" component={EditProfile} />
      <Route path="/communities" component={Communities} />
      <Route path="/communities/:id">
        {params => <Community id={parseInt(params.id)} />}
      </Route>
      <Route path="/create-community" component={CreateCommunity} />
      <Route path="/messages" component={Messages} />
      <Route path="/messages/:id">
        {params => <Messages selectedUserId={parseInt(params.id)} />}
      </Route>
      <Route path="/search" component={Search} />
      <Route path="/notifications" component={Notifications} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
