import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  User,
  Mail,
  Hash,
  KeyRound,
  Phone,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
} from "lucide-react";
import { api } from "../lib/api";
import Topbar from "../components/Topbar/Topbar";
import "./Perfil.css";

const Perfil = () => {
  const { isMobile, setNavOpen } = useOutletContext();
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [contactForm, setContactForm] = useState(null);
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [contactFormData, setContactFormData] = useState({
    nombre: "",
    telefono: "",
    email: "",
    relacion: "",
  });
  const [contactError, setContactError] = useState("");

  const usuario = useMemo(() => {
    const saved = localStorage.getItem("sendero_user");
    return saved ? JSON.parse(saved) : {};
  }, []);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const data = await api.get("/contacts");
      setContacts(data.contacts || []);
    } catch (err) {
      console.error("[PERFIL] Error al cargar contactos:", err.message);
    } finally {
      setLoadingContacts(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Las contraseñas nuevas no coinciden");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError("La nueva contraseña debe tener al menos 8 caracteres");
      return;
    }

    try {
      await api.put("/auth/password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordSuccess("Contraseña actualizada correctamente");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setShowPasswordModal(false), 1500);
    } catch (err) {
      setPasswordError(err.message || "No se pudo actualizar la contraseña");
    }
  };

  const openContactForm = (contact = null) => {
    if (contact && contact.id) {
      setContactForm(contact);
      setContactFormData({
        nombre: contact.nombre || "",
        telefono: contact.telefono || "",
        email: contact.email || "",
        relacion: contact.relacion || "",
      });
    } else {
      setContactForm(null);
      setContactFormData({ nombre: "", telefono: "", email: "", relacion: "" });
    }
    setIsContactFormOpen(true);
    setContactError("");
  };

  const handleContactSave = async (e) => {
    e.preventDefault();
    setContactError("");

    if (!contactFormData.nombre.trim() || !contactFormData.telefono.trim()) {
      setContactError("Nombre y telefono son requeridos");
      return;
    }
    // Normalize telefono: keep only digits
    const cleaned = (contactFormData.telefono || '').replace(/\D/g, '');
    if (cleaned.length !== 10) {
      setContactError('El telefono debe tener exactamente 10 digitos');
      return;
    }

    const payload = {
      ...contactFormData,
      telefono: cleaned,
    };

    try {
      if (contactForm && contactForm.id) {
        await api.put(`/contacts/${contactForm.id}`, payload);
      } else {
        await api.post('/contacts', payload);
      }
      setContactForm(null);
      setIsContactFormOpen(false);
      setContactFormData({ nombre: '', telefono: '', email: '', relacion: '' });
      loadContacts();
    } catch (err) {
      setContactError(err.message || 'No se pudo guardar el contacto');
    }
  };

  const handleContactDelete = async (id) => {
    if (!confirm("\u00bfEstas seguro de eliminar este contacto?")) return;
    try {
      await api.delete(`/contacts/${id}`);
      loadContacts();
    } catch (err) {
      console.error("[PERFIL] Error al eliminar contacto:", err.message);
    }
  };

  return (
    <main className="perfil-main">
      <Topbar
        showMenuToggle={isMobile}
        onMenuToggle={() => setNavOpen((prev) => !prev)}
      />

      <div className="perfil-content">
        <div className="perfil-header">
          <div>
            <p className="section-label">CUENTA</p>
            <h1>
              <User size={28} />
              Mi Perfil
            </h1>
            <p className="header-description">
              Gestiona tu informacion personal y contactos de apoyo.
            </p>
          </div>
        </div>

        <div className="perfil-grid">
          <section className="perfil-card info-card">
            <div className="card-title">
              <User size={18} />
              <h2>Informacion Personal</h2>
            </div>

            <div className="info-fields">
              <div className="info-field">
                <label>
                  <User size={14} />
                  Nombre Completo
                </label>
                <div className="info-value">{usuario.nombre || "N/A"}</div>
              </div>

              <div className="info-field">
                <label>
                  <Mail size={14} />
                  Correo Electronico
                </label>
                <div className="info-value">{usuario.correo || "N/A"}</div>
              </div>

              <div className="info-field">
                <label>
                  <Hash size={14} />
                  Boleta
                </label>
                <div className="info-value">{usuario.boleta || "N/A"}</div>
              </div>
            </div>

            <button
              className="change-password-btn"
              onClick={() => setShowPasswordModal(true)}
            >
              <KeyRound size={15} />
              Cambiar Contraseña
            </button>
          </section>

          <section className="perfil-card contacts-card">
            <div className="card-title">
              <Phone size={18} />
              <h2>Contactos de Apoyo</h2>
              <button className="add-contact-btn" onClick={() => openContactForm()}>
                <Plus size={15} />
                Añadir
              </button>
            </div>

            {isContactFormOpen && (
              <div className="contact-form-overlay">
                <div className="contact-form-inline">
                  <button className="close-form-btn" onClick={() => setIsContactFormOpen(false)}>
                    <X size={16} />
                  </button>
                  <form onSubmit={handleContactSave} className="contact-form">
                    {contactError && <div className="field-error">{contactError}</div>}
                    <div className="form-row">
                      <div className="form-group">
                        <label>Nombre</label>
                        <input
                          type="text"
                          value={contactFormData.nombre}
                          onChange={(e) => setContactFormData({ ...contactFormData, nombre: e.target.value })}
                          placeholder="Nombre completo"
                        />
                      </div>
                      <div className="form-group">
                        <label>Telefono</label>
                        <input
                          type="tel"
                          maxLength={10}
                          value={contactFormData.telefono}
                          onChange={(e) => setContactFormData({ ...contactFormData, telefono: e.target.value })}
                          placeholder="5512345678"
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Correo (opcional)</label>
                        <input
                          type="email"
                          value={contactFormData.email}
                          onChange={(e) => setContactFormData({ ...contactFormData, email: e.target.value })}
                          placeholder="correo@ejemplo.com"
                        />
                      </div>
                      <div className="form-group">
                        <label>Relacion</label>
                        <input
                          type="text"
                          value={contactFormData.relacion}
                          onChange={(e) => setContactFormData({ ...contactFormData, relacion: e.target.value })}
                          placeholder="Madre, Padre, Amigo..."
                        />
                      </div>
                    </div>
                    <button type="submit" className="save-contact-btn">
                      <Save size={14} />
                      {contactForm ? "Actualizar" : "Guardar"}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {loadingContacts ? (
              <div className="contacts-loading">Cargando contactos...</div>
            ) : contacts.length === 0 ? (
              <div className="contacts-empty">
                <p>No tienes contactos de apoyo registrados.</p>
                <span>Haz clic en "Añadir" para agregar uno.</span>
              </div>
            ) : (
              <div className="contacts-list">
                {contacts.map((contact) => (
                  <div key={contact.id} className="contact-item">
                    <div className="contact-info">
                      <strong>{contact.nombre}</strong>
                      <span className="contact-relacion">{contact.relacion || "Sin relacion"}</span>
                      <div className="contact-details">
                        <span>{contact.telefono}</span>
                        {contact.email && <span>{contact.email}</span>}
                      </div>
                    </div>
                    <div className="contact-actions">
                      <button className="edit-contact-btn" onClick={() => openContactForm(contact)}>
                        <Pencil size={13} />
                      </button>
                      <button className="delete-contact-btn" onClick={() => handleContactDelete(contact.id)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {showPasswordModal && (
        <div className="modal-backdrop" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowPasswordModal(false)}>
              <X size={20} />
            </button>

            <div className="modal-header">
              <KeyRound size={22} />
              <h2>Cambiar Contraseña</h2>
            </div>

            <form onSubmit={handlePasswordChange} className="password-form">
              {passwordError && <div className="field-error">{passwordError}</div>}
              {passwordSuccess && <div className="field-success">{passwordSuccess}</div>}

              <div className="form-group">
                <label>Contraseña Actual</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  placeholder="Ingresa tu contraseña actual"
                  required
                />
              </div>

              <div className="form-group">
                <label>Nueva Contraseña</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="Minimo 8 caracteres"
                  required
                />
              </div>

              <div className="form-group">
                <label>Confirmar Nueva Contraseña</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="Repite la nueva contraseña"
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-modal-btn" onClick={() => setShowPasswordModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="submit-modal-btn">
                  Actualizar Contraseña
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Perfil;
