require('dotenv').config(); 
const app = require('./src/app');
const { connectDB } = require('./src/db/config');

const port = process.env.PORT || 3000; 

connectDB().then(() => {
    app.listen(port, () => {
        console.log(`server en el puerto ${port}`);
    });
});