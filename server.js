const express = require("express")
const app = express();


app.listen( process.env.PORT || 3000 , () => {
  console.log('server online')
});

app.use(express.static('dist'));
