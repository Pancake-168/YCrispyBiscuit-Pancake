import { useEffect } from "react";
import { createLogger } from "@/utils/logger";

const log = createLogger("App.tsx", "App");

function App() {
  useEffect(() => {
    log.info("系统启动");
  }, []);

  return (
    <main className="App">

    </main>
  );
}

export default App;
