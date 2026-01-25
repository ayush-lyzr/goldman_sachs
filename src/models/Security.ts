import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISecurity extends Document {
  ISIN: string;
  CUSIP: string;
  FIGI: string;
  Ticker: string;
  Security_Name: string;
  Issuer_Name: string;
  Issuer_Country: string;
  Country_of_Risk: string;
  Instrument_Type: string;
  Seniority: string;
  Currency: string;
  Coupon_Type: string;
  Coupon_Rate: number;
  Issue_Date: string;
  Maturity_Date: string;
  Days_to_Maturity: number;
  Rating_SP: string;
  Rating_Moodys: string;
  Rating_Fitch: string;
  Composite_Rating: string;
  IG_Flag: string;
  Developed_Market: string;
  Sector: string;
  Index_Member: string;
  Approved_Index: string;
  Callable: string;
  Putable: string;
  Subordinated_Flag: string;
  ESG_Exclusion: string;
  Shariah_Compliant: string;
  createdAt: Date;
}

const SecuritySchema = new Schema<ISecurity>(
  {
    ISIN: { type: String, required: true, index: true },
    CUSIP: { type: String, required: true },
    FIGI: { type: String, required: true },
    Ticker: { type: String, required: true },
    Security_Name: { type: String, required: true },
    Issuer_Name: { type: String, required: true },
    Issuer_Country: { type: String, required: true },
    Country_of_Risk: { type: String, required: true },
    Instrument_Type: { type: String, required: true },
    Seniority: { type: String, required: true },
    Currency: { type: String, required: true },
    Coupon_Type: { type: String, required: true },
    Coupon_Rate: { type: Number, required: true },
    Issue_Date: { type: String, required: true },
    Maturity_Date: { type: String, required: true },
    Days_to_Maturity: { type: Number, required: true },
    Rating_SP: { type: String, required: true },
    Rating_Moodys: { type: String, required: true },
    Rating_Fitch: { type: String, required: true },
    Composite_Rating: { type: String, required: true },
    IG_Flag: { type: String, required: true },
    Developed_Market: { type: String, required: true },
    Sector: { type: String, required: true },
    Index_Member: { type: String, required: true },
    Approved_Index: { type: String, required: true },
    Callable: { type: String, required: true },
    Putable: { type: String, required: true },
    Subordinated_Flag: { type: String, required: true },
    ESG_Exclusion: { type: String, required: true },
    Shariah_Compliant: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

// Add compound index for common queries
SecuritySchema.index({ Issuer_Country: 1, Sector: 1 });
SecuritySchema.index({ Composite_Rating: 1 });
SecuritySchema.index({ Instrument_Type: 1 });

// Prevent model recompilation in dev (hot-reload)
export const Security: Model<ISecurity> =
  mongoose.models.Security || mongoose.model<ISecurity>("Security", SecuritySchema);
