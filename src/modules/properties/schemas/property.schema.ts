import * as mongoose from 'mongoose';

export const PropertySchema = new mongoose.Schema({
  sourceId: { type: String, required: true },
  sourceType: { type: String, required: true },
  price: { type: Number, required: true },
  isAvailable: { type: Boolean, required: true },
  location: {
    city: { type: String },
    country: { type: String },
  },
  attributes: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

PropertySchema.methods.toJSON = function () {
  const doc = this as mongoose.Document;
  const obj = doc.toObject();
  delete obj.__v;
  return obj as Record<string, unknown>;
};

// PropertySchema.index({ sourceType: 1, 'location.city': 1 });
PropertySchema.index({ isAvailable: 1, price: 1 });
PropertySchema.index({ sourceId: 1, sourceType: 1 }, { unique: true });

PropertySchema.index(
  {
    'attributes.name': 'text',
    'attributes.description': 'text',
    'location.city': 'text',
    'location.country': 'text',
  },
  {
    weights: {
      'attributes.name': 10,
      'location.city': 5,
      'location.country': 3,
      'attributes.description': 2,
    },
    name: 'property_text_index',
  },
);
