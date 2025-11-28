import mongoose, { Document, Model, Schema } from 'mongoose';

// TypeScript interface for Event document
export interface IEvent extends Document {
  title: string;
  slug: string;
  description: string;
  overview: string;
  image: string;
  venue: string;
  location: string;
  date: string;
  time: string;
  mode: string;
  audience: string;
  agenda: string[];
  organizer: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    overview: {
      type: String,
      required: [true, 'Overview is required'],
      trim: true,
    },
    image: {
      type: String,
      required: [true, 'Image is required'],
      trim: true,
    },
    venue: {
      type: String,
      required: [true, 'Venue is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    date: {
      type: String,
      required: [true, 'Date is required'],
      trim: true,
    },
    time: {
      type: String,
      required: [true, 'Time is required'],
      trim: true,
    },
    mode: {
      type: String,
      required: [true, 'Mode is required'],
      trim: true,
    },
    audience: {
      type: String,
      required: [true, 'Audience is required'],
      trim: true,
    },
    agenda: {
      type: [String],
      required: [true, 'Agenda is required'],
      validate: {
        validator: (v: string[]) => Array.isArray(v) && v.length > 0,
        message: 'Agenda must contain at least one item',
      },
    },
    organizer: {
      type: String,
      required: [true, 'Organizer is required'],
      trim: true,
    },
    tags: {
      type: [String],
      required: [true, 'Tags are required'],
      validate: {
        validator: (v: string[]) => Array.isArray(v) && v.length > 0,
        message: 'Tags must contain at least one item',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Create unique index on slug
EventSchema.index({ slug: 1 }, { unique: true });

/**
 * Pre-save hook to generate slug from title and normalize date/time
 * - Generates URL-friendly slug only when title changes
 * - Appends unique suffix to prevent collisions
 * - Normalizes date to ISO format (YYYY-MM-DD)
 * - Ensures time is in consistent format (HH:MM)
 */
EventSchema.pre('save', async function (next) {
  // Generate slug if title is new or modified
  if (this.isModified('title')) {
    const baseSlug = this.title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    
    // Try base slug first
    this.slug = baseSlug;
    
    // Check if slug already exists (excluding current document)
    const Event = mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);
    const existingEvent = await Event.findOne({ 
      slug: this.slug, 
      _id: { $ne: this._id } 
    });
    
    // If collision detected, append timestamp-based suffix
    if (existingEvent) {
      const suffix = Date.now().toString(36); // Base36 timestamp for conciseness
      this.slug = `${baseSlug}-${suffix}`;
    }
  }

  // Normalize date to ISO format (YYYY-MM-DD)
  if (this.isModified('date')) {
    const parsedDate = new Date(this.date);
    if (isNaN(parsedDate.getTime())) {
      throw new Error('Invalid date format. Expected a valid date string.');
    }
    this.date = parsedDate.toISOString().split('T')[0];
  }

  // Normalize time format to HH:MM (24-hour format)
  if (this.isModified('time')) {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    const time12Regex = /^(0?[1-9]|1[0-2]):([0-5][0-9])\s?(AM|PM)$/i;

    // If already in HH:MM format, validate and pad if needed
    if (timeRegex.test(this.time)) {
      const [hours, minutes] = this.time.split(':');
      this.time = `${hours.padStart(2, '0')}:${minutes}`;
    }
    // Convert 12-hour format to 24-hour format
    else if (time12Regex.test(this.time)) {
      const match = this.time.match(time12Regex);
      if (match) {
        let hours = parseInt(match[1], 10);
        const minutes = match[2];
        const period = match[3].toUpperCase();

        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;

        this.time = `${hours.toString().padStart(2, '0')}:${minutes}`;
      }
    } else {
      throw new Error(
        'Invalid time format. Expected HH:MM (24-hour) or HH:MM AM/PM (12-hour).'
      );
    }
  }

  next();
});

// Prevent model overwrite during hot reloads in development
const Event: Model<IEvent> =
  mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);

export default Event;
