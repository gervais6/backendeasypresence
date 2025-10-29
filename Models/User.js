// models/User.js
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    // Informations de base (requises)
    name: { 
        type: String, 
        required: [true, 'Le nom est requis'],
        trim: true,
        maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
    },
    email: { 
        type: String, 
        required: [true, 'L\'email est requis'],
        unique: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Format d\'email invalide']
    },
    password: { 
        type: String, 
        required: [true, 'Le mot de passe est requis'],
        minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères']
    },
    role: { 
        type: String, 
        enum: {
            values: ["admin", "employe", "autre"],
            message: 'Rôle invalide. Valeurs acceptées: admin, employe, autre'
        }, 
        required: [true, 'Le rôle est requis'],
        default: "employe"
    },

    // Informations professionnelles
    number: { 
        type: String, 
        trim: true,
        maxlength: [20, 'Le numéro ne peut pas dépasser 20 caractères']
    },
    position: { 
        type: String, 
        trim: true,
        maxlength: [100, 'La position ne peut pas dépasser 100 caractères']
    },
    qg: { 
        type: String, 
        trim: true,
        maxlength: [50, 'Le QG ne peut pas dépasser 50 caractères']
    },
    
    // Image de profil
    image: { 
        type: String, 
        default: "" 
    },
    
    // NOUVEAUX CHAMPS - Informations professionnelles étendues
    workLocation: { 
        type: String, 
        default: "",
        maxlength: [100, 'Le lieu de travail ne peut pas dépasser 100 caractères']
    },
    contractStart: { 
        type: Date,
        validate: {
            validator: function(value) {
                if (!value) return true;
                if (this.contractEnd && value > this.contractEnd) return false;
                return true;
            },
            message: 'La date de début ne peut pas être après la date de fin'
        }
    },
    contractEnd: { 
        type: Date,
        validate: {
            validator: function(value) {
                if (!value) return true;
                if (this.contractStart && value < this.contractStart) return false;
                return true;
            },
            message: 'La date de fin ne peut pas être avant la date de début'
        }
    },
    salary: { 
        type: Number, 
        default: 0,
        min: [0, 'Le salaire ne peut pas être négatif']
    },
    contractType: { 
        type: String, 
        enum: {
            values: ["CDI", "CDD", "Stage", "Alternance", "Freelance", ""],
            message: 'Type de contrat invalide'
        },
        default: ""
    },
    
    // Activités et relations
    activity: { 
        type: String, 
        default: "",
        maxlength: [500, 'L\'activité ne peut pas dépasser 500 caractères']
    },
    activityBy: { 
        type: String, 
        default: "",
        maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
    },
    activityDeadline: { 
        type: Date 
    },
    birthday: { 
        type: Date,
        validate: {
            validator: function(value) {
                if (!value) return true;
                return value <= new Date();
            },
            message: 'La date d\'anniversaire ne peut pas être dans le futur'
        }
    },
    mentor: { 
        type: String, 
        default: "",
        maxlength: [100, 'Le nom du mentor ne peut pas dépasser 100 caractères']
    },
    manager: { 
        type: String, 
        default: "",
        maxlength: [100, 'Le nom du manager ne peut pas dépasser 100 caractères']
    },
    nationality: { 
        type: String, 
        default: "",
        maxlength: [50, 'La nationalité ne peut pas dépasser 50 caractères']
    }
    
}, { 
    timestamps: true,
    toJSON: {
        transform: function(doc, ret) {
            // Exclure le mot de passe lors de la sérialisation
            delete ret.password;
            return ret;
        }
    }
});

// Index pour améliorer les performances des recherches
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ qg: 1 });
UserSchema.index({ name: 'text', email: 'text', position: 'text' });

module.exports = mongoose.model("User", UserSchema);
