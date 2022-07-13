import React, { FC, memo, useEffect, useState } from "react";

import "./App.css";
import { ContactEvent } from "./types/contact";

function App() {
  return (
    <div className="App">
      <Contact />
    </div>
  );
}

export default App;

const APP_NAME = "CWTestApp";

export const useContacts = () => {
  const [contacts, setContacts] = useState<ContactEvent[]>([]);

  useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (event.data && event.data.events && event.data.issuer === "MAX") {
        console.log(`==== Received ${event.data.events.length} events =====`);

        const contactEvents: ContactEvent[] = event.data.events.filter(
          (e: any) => e.hasOwnProperty("Type") && e.Type.includes("Contact")
        );

        console.log(
          `==== Received ${contactEvents.length} contact events =====`
        );

        if (contactEvents.length > 0) {
          console.log({ contacts: contactEvents });

          setContacts((contacts) => {
            for (let update of contactEvents) {
              // filter out contact from existing list
              contacts = contacts.filter(
                (e) => e.ContactID !== update.ContactID
              );
              // if disconnected, then no need to add it back
              // otherwise, this will effectively replace the contact with the new udpate
              switch (update.Status) {
                case "Disconnected":
                  break;
                default:
                  contacts = [...contacts, update];
                  break;
              }
            }
            return contacts;
          });
        }
      }
    };

    window.addEventListener("message", listener);
    (window.opener || window.parent).postMessage(
      /*
        Subscribe to MAX events
      */
      {
        issuer: APP_NAME,
        messageType: "RegisterForClientEvents",
        subscriptionTypes: ["all"],
      },
      "*"
    );
    return () => {
      (window.opener || window.parent).postMessage(
        {
          issuer: APP_NAME,
          messageType: "UnegisterFromClientEvents",
        },
        "*"
      );
      window.removeEventListener("message", listener);
    };
  }, []);

  return { contacts };
};

export const Contact: FC = memo(() => {
  const { contacts } = useContacts();

  return (
    <>
      {contacts.map((e: ContactEvent) => {
        return <h4>{e.ContactID}</h4>;
      })}
    </>
  );
});
