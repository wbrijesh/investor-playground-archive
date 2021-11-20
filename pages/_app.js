import { useState, useEffect } from "react";
import { supabase } from "../utils/supabaseClient";
import Auth from "../components/Auth";
import Account from "../components/Account";
import "../styles/globals.css";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function MyApp({ Component, pageProps }) {
  const [session, setSession] = useState("initial state");

  useEffect(() => {
    setSession(true);
    setSession(supabase.auth.session());

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    session !== "initial state" && setLoading(false);
  }, []);

  return <div>{!session ? <Auth /> : <Component {...pageProps} />}</div>;
}

export default MyApp;
