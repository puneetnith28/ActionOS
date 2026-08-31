"use client";

import { useEffect, useState } from "react";
import { recoverableIdentity } from "../lib/firebase-client";

export function DashboardGreeting() {
  const [name, setName] = useState<string>("Commander");

  useEffect(() => {
    recoverableIdentity()
      .then((identity) => {
        if (identity.name) {
          // Extract first name if possible
          const firstName = identity.name.split(" ")[0];
          setName(firstName);
        } else if (identity.email) {
          const emailName = identity.email.split("@")[0];
          // capitalize
          setName(emailName.charAt(0).toUpperCase() + emailName.slice(1));
        }
      })
      .catch(console.error);
  }, []);

  return (
    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-white drop-shadow-lg">
      Good morning, {name}.
    </h1>
  );
}
