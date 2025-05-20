import mongoose, { Schema, model, models } from "mongoose";

const interactionSchema = new Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BlogPost', // Assuming you have a BlogPost model
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Assuming you have a User model
      required: true,
    },
    hasLiked: {
        type: Boolean,
        default: false
    },
    hasDisliked: {
        type: Boolean,
        default: false
    },
    isSaved: {
        type: Boolean,
        default: false
    },
  },
  { timestamps: true }
);


const Interaction = models.Interaction || model('Interaction', interactionSchema);

export default Interaction;