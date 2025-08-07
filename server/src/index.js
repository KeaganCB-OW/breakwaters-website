import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import recruitmentOfficerRoutes from './routes/recruitmentOfficerRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';

dotenv.config();

const app = express();
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/officers', recruitmentOfficerRoutes);
app.use('/api/assignments', assignmentRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
