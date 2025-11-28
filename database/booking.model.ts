import mongoose, { Document, Model, Schema, Types } from 'mongoose';

// TypeScript interface for Booking document
export interface IBooking extends Document {
  eventId: Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      validate: {
        validator: (v: string) => {
          // RFC 5322 compliant email regex
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Invalid email format',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Create index on eventId for faster queries
BookingSchema.index({ eventId: 1 });

/**
 * Pre-save hook to validate that the referenced event exists
 * - Checks if eventId corresponds to an actual Event document
 * - Throws error if event is not found in database
 */
BookingSchema.pre('save', async function (next) {
  // Only validate eventId if it's new or modified
  if (this.isModified('eventId')) {
    // Dynamically import Event model to avoid circular dependency
    const Event = mongoose.model('Event');
    
    const eventExists = await Event.exists({ _id: this.eventId });
    
    if (!eventExists) {
      throw new Error(
        `Event with ID ${this.eventId} does not exist. Cannot create booking.`
      );
    }
  }

  next();
});

// Prevent model overwrite during hot reloads in development
const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);

export default Booking;
