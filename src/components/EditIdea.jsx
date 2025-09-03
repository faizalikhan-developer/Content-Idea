import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getIdeas, updateIdea } from '../utils/db';
import { useNavigate, useParams } from 'react-router-dom';

function EditIdea() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    contentIdea: '',
    context: '',
    problem: '',
    discovery: '',
    teachingAngle: '',
    code: '',
    hook: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIdea = async () => {
      try {
        const { ideas } = await getIdeas(user.uid, 1, 1, '', { id: Number(id) });
        if (ideas.length > 0) {
          setFormData(ideas[0]);
        } else {
          setError('Idea not found');
        }
      } catch (err) {
        setError('Failed to load idea: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchIdea();
  }, [user, id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    try {
      await updateIdea(Number(id), user.uid, { ...formData });
      navigate('/contents-table');
    } catch (err) {
      setError('Failed to update idea: ' + err.message);
    }
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Edit Idea</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700">Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700">Content Idea</label>
          <textarea
            name="contentIdea"
            value={formData.contentIdea}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="4"
          />
        </div>
        <div>
          <label className="block text-gray-700">Context</label>
          <textarea
            name="context"
            value={formData.context}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="4"
          />
        </div>
        <div>
          <label className="block text-gray-700">Problem</label>
          <textarea
            name="problem"
            value={formData.problem}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="4"
          />
        </div>
        <div>
          <label className="block text-gray-700">Discovery</label>
          <textarea
            name="discovery"
            value={formData.discovery}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="4"
          />
        </div>
        <div>
          <label className="block text-gray-700">Teaching Angle</label>
          <textarea
            name="teachingAngle"
            value={formData.teachingAngle}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="4"
          />
        </div>
        <div>
          <label className="block text-gray-700">Code</label>
          <textarea
            name="code"
            value={formData.code}
            onChange={handleChange}
            className="w-full p-2 border rounded font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="4"
          />
        </div>
        <div>
          <label className="block text-gray-700">Hook</label>
          <textarea
            name="hook"
            value={formData.hook}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="4"
          />
        </div>
        <div className="flex space-x-4">
          <button
            type="submit"
            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition"
          >
            Update Idea
          </button>
          <button
            type="button"
            onClick={() => navigate('/contents-table')}
            className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditIdea;