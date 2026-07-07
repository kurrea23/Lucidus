"use client";

import { useEffect } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { connectCloud, disconnectCloud } from "@/lib/supabase/sync";

/**
 * Invisible component that keeps the local store connected to the signed-in
 * Supabase account. Renders nothing; does nothing when cloud mode is off.
 */
export function AuthProvider() {
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;

    void sb.auth.getSession().then(({ data }) => {
      if (data.session?.user) void connectCloud(data.session.user);
    });

    const { data: sub } = sb.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session?.user) {
        void connectCloud(session.user);
      }
      if (event === "SIGNED_OUT") {
        disconnectCloud();
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return null;
}
