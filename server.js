require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./Routes/auth');
const ajoutMembreRoutes = require('./Routes/ajoutMembreRoutes'); // <- chemin corrigé

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());
app.use(express.json({ limit: "10mb" })); // pour accepter le base64 du QR


const mongoDBURL = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/mydemoDB';

mongoose.connect(mongoDBURL, { 
    useUnifiedTopology: true,
    useNewUrlParser: true // Ajoutez cette option si nécessaire
})
.then(() => console.log('Connexion à MongoDB réussie'))
.catch(err => console.error('Erreur de connexion à MongoDB:', err));

app.use('/api/auth', authRoutes);
app.use('/api', ajoutMembreRoutes);
app.use('/api/membres', ajoutMembreRoutes);


app.get('/', (req, res) => {
    res.send('Bienvenue sur l\'API');
});

app.listen(PORT, () => {
    console.log(`Server started at port ${PORT}`);
});
