import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRuleset {
  version: number;
  versionName: string;
  createdAt: Date;
  data: {
    mapped_rules?: Array<{
      constraint: string;
      sentinel_allowed_values: string[];
      rules: string[];
    }>;
    raw_rules?: Array<{
      title: string;
      rules: string[];
    }>;
    gap_analysis?: Array<{
      constraint: string;
      // Newer agent response shape
      allowed_values?: string[];
      not_allowed_values?: string[];
      // Backwards compatible shape (older agent response)
      pdf_value?: string[];
      fidessa_value?: string[];
      delta: string;
      matched: boolean;
    }>;
  };
}

export interface ISelectedCompany {
  companyId: string;
  companyName: string;
  fidessa_catalog: Record<string, string>;
}

export interface IProject extends Document {
  name: string;
  customerId: string;
  selectedCompany?: ISelectedCompany;
  createdAt: Date;
  rulesets: IRuleset[];
}

const RulesetSchema = new Schema<IRuleset>(
  {
    version: {
      type: Number,
      required: true,
    },
    versionName: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  { _id: false }
);

const SelectedCompanySchema = new Schema(
  {
    companyId: {
      type: String,
      required: true,
    },
    companyName: {
      type: String,
      required: true,
    },
    fidessa_catalog: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  { _id: false }
);

const ProjectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    customerId: {
      type: String,
      required: true,
      unique: true,
    },
    selectedCompany: {
      type: SelectedCompanySchema,
      required: false,
    },
    rulesets: {
      type: [RulesetSchema],
      default: [],
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

// Prevent model recompilation in dev (hot-reload)
export const Project: Model<IProject> =
  mongoose.models.Project || mongoose.model<IProject>("Project", ProjectSchema);
