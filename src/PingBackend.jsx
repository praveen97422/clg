import { useEffect } from "react";
import { BASE_URL } from "./apiConfig";

function PingBackend() {
  useEffect(() => {
    const sendPing = () => {
      fetch(`${BASE_URL}/ping`)
        .then((response) => {
          if (!response.ok) {
            console.error("Ping failed:", response.statusText);
          }
        })
        .catch((error) => {
          console.error("Ping error:", error);
        });
    };

    // Send initial ping immediately
    sendPing();

    // Set interval to send ping every 30 minutes (1800000 ms)
    const intervalId = setInterval(sendPing, 180000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  return null; // This component does not render anything
}

export default PingBackend;
