const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getMyPets,
  addPet,
  updatePet,
  deletePet,
  addVaccination,
  deleteVaccination,
  addTreatment,
  deleteTreatment
} = require('../controllers/petController');

// Tüm rotalar için auth zorunlu
router.use(protect);

router.get('/', getMyPets);
router.post('/', addPet);
router.put('/:id', updatePet);
router.delete('/:id', deletePet);

router.post('/:id/vaccinations', addVaccination);
router.delete('/:id/vaccinations/:vacId', deleteVaccination);

router.post('/:id/treatments', addTreatment);
router.delete('/:id/treatments/:trtId', deleteTreatment);

module.exports = router;
