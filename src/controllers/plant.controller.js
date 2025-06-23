const plantService = require('../services/plant.service');

exports.getAllPlants = async (req, res) => {
  try {
    const plants = await plantService.getAllPlants();  // service se call
    res.render('plants/index', { plants, page:"plants" });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching plants');
  }
};


exports.createPlant = async (req, res) => {
  const { name } = req.body;

  try {
    await plantService.createPlant(name);
    res.redirect('/plants');
  } catch (error) {
    console.error('Error adding plant:', error);
    res.status(500).send('Error adding plant');
  }
};

