import React, { useState, useMemo, useEffect } from 'react';
import { DocumentCategory, Role, ProjectStatus } from '../types';
import { ICONS, DOCUMENT_CATEGORIES } from '../constants';
import { getDocumentCategories } from '../services/masterDataLookups';
import { Select, FileInput } from './FormControls';
const UploadModal = ({ project, user, onClose, onAddDocument, categories = [] }) => {
    const [file, setFile] = useState(null);
    const categoryOptions = useMemo(() => {
        const list = categories.length > 0 ? categories : DOCUMENT_CATEGORIES;
        return list.map(c => (typeof c === 'object' ? c : { value: c, label: c }));
    }, [categories]);
    const [category, setCategory] = useState(() => (categoryOptions[0]?.value || DocumentCategory.OTHER));
    const handleFileChange = (e) => {
        setFile(e.target.files?.[0] || null);
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!file) {
            alert('Please select a file to upload.');
            return;
        }
        const newDocument = {
            id: `DOC-${project.id}-${Date.now()}`,
            projectId: project.id,
            fileName: file.name,
            fileUrl: URL.createObjectURL(file),
            category: category,
            uploadedBy: user.username,
            uploadDate: new Date().toISOString(),
        };
        onAddDocument(newDocument);
        onClose();
    };
    return (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 fade-in">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-scale-in">
                <div className="p-5 border-b border-light-border">
                    <h3 className="text-lg font-semibold text-text-dark">Upload Document to "{project.name}"</h3>
                </div>
                <div className="p-6 space-y-4">
                    <FileInput label="Select Document" id="document-upload" name="document-upload" onChange={handleFileChange} fileName={file?.name} required/>
                    <Select label="Document Category" id="category" name="category" value={category} onChange={e => setCategory(e.target.value)} options={categoryOptions}/>
                </div>
                <div className="p-4 border-t border-light-border flex justify-end space-x-3 bg-light-main rounded-b-2xl">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 bg-light-border text-text-dark rounded-lg hover:bg-gray-200 font-medium">Cancel</button>
                    <button type="submit" className="px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-opacity-90 font-medium shadow-sm">Upload</button>
                </div>
            </form>
        </div>);
};
const ProjectDetailModal = ({ project, onClose }) => {
    const DetailItem = ({ label, value }) => (<div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 border-b border-light-border">
            <dt className="text-sm font-medium text-text-light">{label}</dt>
            <dd className="mt-1 text-sm text-text-dark sm:mt-0 sm:col-span-2">{value || 'N/A'}</dd>
        </div>);
    return (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-scale-in">
                <div className="p-5 border-b border-light-border">
                    <h3 className="text-lg font-semibold text-text-dark">Project Details: {project.name}</h3>
                </div>
                <div className="p-6 overflow-y-auto">
                    <dl>
                        <DetailItem label="Project ID" value={project.id}/>
                        <DetailItem label="Status" value={<span className="font-semibold">{project.status}</span>}/>
                        <DetailItem label="Zone / Woreda" value={`${project.zone} / ${project.woreda}`}/>
                        <DetailItem label="Project Type" value={`${project.projectType} (${project.projectSubType})`}/>
                        <DetailItem label="Intervention Type" value={project.typeOfIntervention}/>
                        <DetailItem label="Population Coverage" value={project.populationCoverage.toLocaleString()}/>
                        <DetailItem label="Implementing Body" value={project.implementingBody}/>
                        <DetailItem label="Budget (ETB)" value={project.estimatedBudget.toLocaleString()}/>
                        <DetailItem label="Funding Source" value={project.fundingSource}/>
                        <DetailItem label="Creator" value={project.creator}/>
                    </dl>
                </div>
                <div className="p-4 border-t border-light-border flex justify-end bg-light-main rounded-b-2xl">
                    <button onClick={onClose} className="px-5 py-2.5 bg-light-border text-text-dark rounded-lg hover:bg-gray-200 font-medium">Close</button>
                </div>
            </div>
        </div>);
};
const DocumentModule = ({ projects, documents, user, onAddDocument, onDeleteDocument, masterData }) => {
    const [selectedProject, setSelectedProject] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const documentCategories = useMemo(() => getDocumentCategories(masterData), [masterData]);
    const filteredProjects = useMemo(() => {
        return projects.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter ? p.status === statusFilter : true;
            return matchesSearch && matchesStatus;
        });
    }, [projects, searchTerm, statusFilter]);
    const projectDocuments = useMemo(() => {
        if (!selectedProject)
            return [];
        return documents
            .filter(d => {
            const matchesProject = d.projectId === selectedProject.id;
            const matchesCategory = categoryFilter ? d.category === categoryFilter : true;
            return matchesProject && matchesCategory;
        })
            .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
    }, [documents, selectedProject, categoryFilter]);
    const canDelete = user?.role === Role.ADMIN || user?.role === Role.CONTRACT_MANAGER;
    useEffect(() => {
        setCategoryFilter('');
    }, [selectedProject]);
    return (<div className="flex h-full gap-6">
            <aside className="w-1/3 max-w-sm flex flex-col bg-white rounded-2xl border border-light-border shadow-sm">
                <div className="p-4 border-b border-light-border">
                    <h3 className="font-semibold text-lg">Projects</h3>
                     <div className="relative mt-2">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-text-light">{ICONS.search}</span>
                        <input type="search" placeholder="Search projects..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-light-main border border-light-border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary"/>
                    </div>
                    <div className="mt-4">
                        <label htmlFor="status-filter" className="block text-sm font-medium text-text-light mb-1">Status</label>
                        <select id="status-filter" name="status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-4 py-2 bg-light-main border border-light-border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary">
                            <option value="">All Statuses</option>
                            {Object.values(ProjectStatus).map((status) => (<option key={status} value={status}>
                                    {status}
                                </option>))}
                        </select>
                    </div>
                </div>
                <nav className="flex-1 overflow-y-auto">
                    <ul>
                        {filteredProjects.map(p => (<li key={p.id}>
                                <button onClick={() => setSelectedProject(p)} className={`w-full text-left p-4 text-sm transition-colors ${selectedProject?.id === p.id ? 'bg-primary-light text-primary font-semibold' : 'hover:bg-light-main'}`}>
                                    <p className="font-medium">{p.name}</p>
                                    <p className={`text-xs ${selectedProject?.id === p.id ? 'text-primary/80' : 'text-text-light'}`}>{p.id}</p>
                                </button>
                            </li>))}
                    </ul>
                </nav>
            </aside>
            <main className="flex-1 bg-white rounded-2xl border border-light-border shadow-sm overflow-hidden flex flex-col">
                {selectedProject ? (<>
                        <div className="p-5 border-b border-light-border flex justify-between items-center flex-wrap gap-4">
                            <div>
                                <h2 className="text-lg font-semibold text-text-dark">{selectedProject.name} - Documents</h2>
                                <p className="text-text-light text-sm mt-1">{projectDocuments.length} document(s) found.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setIsDetailModalOpen(true)} className="px-4 py-2 bg-light-hover text-text-dark font-medium rounded-lg hover:bg-light-border flex items-center gap-2">
                                    {React.cloneElement(ICONS.info, { className: 'w-4 h-4' })}
                                    <span>View Details</span>
                                </button>
                                <button onClick={() => setIsUploadModalOpen(true)} className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-opacity-90 shadow-sm flex items-center gap-2">
                                {React.cloneElement(ICONS.paperclip, { className: 'w-4 h-4' })}
                                <span>Upload Document</span>
                                </button>
                            </div>
                        </div>
                        <div className="p-4 border-b border-light-border bg-light-main/50 flex items-center gap-4">
                            <label htmlFor="category-filter" className="text-sm font-medium text-text-light flex-shrink-0">Filter by Category:</label>
                            <select id="category-filter" name="category-filter" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full md:w-auto md:max-w-xs px-3 py-1.5 bg-white border border-light-border rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary">
                                <option value="">All Categories</option>
                                {documentCategories.map((cat) => (<option key={cat} value={cat}>
                                        {cat}
                                    </option>))}
                            </select>
                        </div>
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-light-main text-xs uppercase text-text-light font-semibold sticky top-0">
                                    <tr>
                                        <th className="px-6 py-4">File Name</th>
                                        <th className="px-6 py-4">Category</th>
                                        <th className="px-6 py-4">Uploaded By</th>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {projectDocuments.length > 0 ? (projectDocuments.map((doc, index) => (<tr key={doc.id} className={`hover:bg-light-main ${index < projectDocuments.length - 1 ? 'border-b border-light-border' : ''}`}>
                                                <td className="px-6 py-4 font-medium text-text-dark">{doc.fileName}</td>
                                                <td className="px-6 py-4 text-text-light">{doc.category}</td>
                                                <td className="px-6 py-4 text-text-light">{doc.uploadedBy}</td>
                                                <td className="px-6 py-4 text-text-light">{new Date(doc.uploadDate).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 text-center space-x-4">
                                                    <a href={doc.fileUrl} download={doc.fileName} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">Download</a>
                                                    {canDelete &&
                    <button onClick={() => onDeleteDocument(doc.id)} className="font-medium text-danger hover:underline">Delete</button>}
                                                </td>
                                            </tr>))) : (<tr>
                                            <td colSpan={5} className="text-center py-24 text-text-light">
                                                <p className="font-semibold">No documents match the selected category.</p>
                                                <p>Try selecting a different category or "All Categories".</p>
                                            </td>
                                        </tr>)}
                                </tbody>
                            </table>
                        </div>
                    </>) : (<div className="flex items-center justify-center h-full text-center text-text-light">
                        <div>
                           <div className="w-16 h-16 mx-auto text-primary opacity-30">
                                {ICONS.documents}
                           </div>
                           <p className="mt-4 font-semibold text-lg">Select a project to view its documents.</p>
                           <p>Use the search and filter tools on the left to find a project.</p>
                        </div>
                    </div>)}
            </main>

            {isUploadModalOpen && selectedProject && (<UploadModal project={selectedProject} user={user} onClose={() => setIsUploadModalOpen(false)} onAddDocument={onAddDocument} categories={documentCategories}/>)}
            {isDetailModalOpen && selectedProject && (<ProjectDetailModal project={selectedProject} onClose={() => setIsDetailModalOpen(false)}/>)}
        </div>);
};
export default DocumentModule;
