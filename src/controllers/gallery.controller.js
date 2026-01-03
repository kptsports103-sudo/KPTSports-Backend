const Gallery = require('../models/gallery.model');

exports.getGalleries = async (req, res) => {
  try {
    const galleries = await Gallery.find();
    // Convert media to objects for backward compatibility
    const processedGalleries = galleries.map(gallery => {
      const processedMedia = gallery.media.map(item => {
        if (typeof item === 'string') {
          return { url: item, overview: '' };
        }
        return item;
      });
      return { ...gallery.toObject(), media: processedMedia };
    });
    res.json(processedGalleries);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createGallery = async (req, res) => {
  const { title, media = [], visibility = true } = req.body;
  console.log('Creating gallery:', { title, media, visibility });

  if (!title || !title.trim()) {
    return res.status(400).json({ message: 'Title is required' });
  }

  // Convert media if it's array of strings (backward compatibility)
  let processedMedia = media;
  if (Array.isArray(media) && media.length > 0 && typeof media[0] === 'string') {
    processedMedia = media.map(url => ({ url, overview: '' }));
  }

  try {
    const gallery = new Gallery({ title: title.trim(), media: processedMedia, visibility });
    await gallery.save();
    res.status(201).json(gallery);
  } catch (error) {
    console.error('Error creating gallery:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateGallery = async (req, res) => {
  const { id } = req.params;
  const { title, media = [], visibility = true } = req.body;
  console.log('Updating gallery:', id, req.body);

  if (!title || !title.trim()) {
    return res.status(400).json({ message: 'Title is required' });
  }

  // Convert media if it's array of strings (backward compatibility)
  let processedMedia = media;
  if (Array.isArray(media) && media.length > 0 && typeof media[0] === 'string') {
    processedMedia = media.map(url => ({ url, overview: '' }));
  }

  try {
    const gallery = await Gallery.findByIdAndUpdate(id, { title: title.trim(), media: processedMedia, visibility }, { new: true });
    if (!gallery) {
      return res.status(404).json({ message: 'Gallery not found' });
    }
    res.json(gallery);
  } catch (error) {
    console.error('Error updating gallery:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteGallery = async (req, res) => {
  const { id } = req.params;
  try {
    const gallery = await Gallery.findByIdAndDelete(id);
    if (!gallery) {
      return res.status(404).json({ message: 'Gallery not found' });
    }
    res.json({ message: 'Gallery deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};