import { registerUnbound } from 'discourse/lib/helpers';
import { emojiUnescape } from 'discourse/lib/emoji';

registerUnbound('i18n', (key, params) => I18n.t(key, params));
registerUnbound('replace-emoji', text => new Handlebars.SafeString(emojiUnescape(text)));
