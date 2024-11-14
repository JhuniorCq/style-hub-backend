import cron from "node-cron";

let cont = 0;

cron.schedule("* * * * *", () => {
  try {
    if (cont === 1) {
      throw new Error("Soy un error");
    }
    console.log("Hola", cont);
    cont++;
  } catch (error) {
    console.error("Hubo un error: ", error.message);
    cont++;
  }
});
